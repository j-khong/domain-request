import { RequestableFields } from '../../domain-request/types.ts';
import { isSomethingLike } from '../../domain-request/type-checkers.ts';
import { Options } from '../../domain-request/field-configuration/object.ts';
import {
   FilterArrayType,
   isComparison,
   isComputedComparison,
   isFilteringFields,
   Operator,
} from '../../domain-request/field-configuration/types.ts';
import { processAllFilters, createRequestFullFieldName, createSqlAlias } from './functions.ts';
import { ToDbSqlConverter, likeEscapeClause } from './converters.ts';
import { Dialect, defaultDialect } from './dialect.ts';

export type TableMapping<DomainFieldNames extends string> = {
   [Property in DomainFieldNames]: FieldMapping;
};

export type TableDef = {
   name: string;
   primaryKey: string;
};

export type OneToOneTableDef = {
   name: string;
   primaryKey: string;
   foreignKey: string;
};

export type OneToManyTableDef = {
   name: string;
   primaryKey: string;
   foreign: {
      keyName: string;
      otherTable: TableDef;
   };
};

// export type ManyToManyTableDef = {
//    name: string;
//    primaryKey: string;
//    foreignKey1: string;
//    foreignKey2: string;
// };

type Child = {
   domain: string;
   toDomainConvert: (o: unknown) => unknown | undefined;
   dbAlias: string;
   dbFullFieldName: string;
};
export function isChild(o: unknown): o is Child {
   return (
      isSomethingLike<Child>(o) && o.domain !== undefined && o.dbAlias !== undefined && o.dbFullFieldName !== undefined
   );
}

export type DomainPath = {
   name: string;
   type: 'array' | 'object' | 'value';
   /** for an array: sql alias of the column identifying one element of the array */
   keyAlias?: string;
};
export type FieldNames = {
   rootDomain: DomainPath;
   children: Array<Child | ProcessResult>;
};
export type ProcessResult = {
   fieldnames: FieldNames;
   tablename: string;
   /** primary key of tablename, required to fetch a one to many nested in another one to many */
   primaryKey?: string;
   joins: string[];
};

export type ProcessFiltersResult = string[];

type ProcessOneToManyResult = ProcessResult;
export abstract class FieldMapping {
   constructor(protected readonly tableDef: Readonly<TableDef>) {}

   processField(_domainFieldname: string, _value: boolean | RequestableFields<unknown>): ProcessResult | undefined {
      return undefined;
   }

   processAllFilters(
      _domainFieldname: string,
      _filters: FilterArrayType<unknown>,
      _errors: string[],
      _dialect?: Dialect,
   ): { or: string[]; and: string[]; joins: string[] } {
      return { or: [], and: [], joins: [] };
   }

   processOneToMany(
      _domainFieldname: string,
      _value: boolean | RequestableFields<unknown>,
      _errors: string[] = [],
   ): ProcessOneToManyResult | undefined {
      return undefined;
   }

   getOrderBy(_o: Options<string>): string[] {
      return [];
   }
}

export class SameTableMapping extends FieldMapping {
   constructor(
      tableDef: Readonly<TableDef>,
      protected readonly fieldname: string,
      protected readonly toDbConvert: ToDbSqlConverter<unknown>,
      protected readonly toDomainConvert: (o: unknown) => unknown | undefined,
   ) {
      super(tableDef);
   }

   processField(domainFieldname: string, _value: boolean): ProcessResult {
      const ret: ProcessResult = {
         fieldnames: {
            children: [
               {
                  domain: domainFieldname,
                  toDomainConvert: this.toDomainConvert,
                  dbAlias: createSqlAlias(this.tableDef.name, this.fieldname),
                  dbFullFieldName: createRequestFullFieldName(this.tableDef.name, this.fieldname),
               },
            ],
            rootDomain: { name: domainFieldname, type: 'value' },
         },
         tablename: this.tableDef.name,
         joins: [],
      };
      return ret;
   }

   processAllFilters<T>(
      domainFieldname: Extract<keyof T, string>,
      domainFilters: FilterArrayType<T>,
      errors: string[],
      dialect: Dialect = defaultDialect,
   ): { or: string[]; and: string[]; joins: string[] } {
      return sameTableProcessAllFilters(
         domainFieldname,
         domainFilters,
         `${this.tableDef.name}.${this.fieldname}`,
         this.toDbConvert,
         errors,
         dialect,
      );
   }

   getOrderBy(o: Options<string>): string[] {
      return [`${this.tableDef.name}.${this.fieldname} ${o.orderby?.sort === 'desc' ? 'desc' : 'asc'}`];
   }
}

export class SameTableObjectMapping<T extends string> extends FieldMapping {
   constructor(
      tableDef: Readonly<TableDef>,
      protected readonly mapping: TableMapping<T>,
   ) {
      super(tableDef);
   }

   processField(domainFieldname: string, value: RequestableFields<unknown>): ProcessResult {
      const ret: ProcessResult = {
         fieldnames: { rootDomain: { name: domainFieldname, type: 'object' }, children: [] },
         tablename: this.tableDef.name,
         joins: [],
      };
      for (const domFieldname in value) {
         const tmap = this.mapping[domFieldname as T] as FieldMapping;
         const res = tmap.processField(domFieldname, value[domFieldname as T]);
         if (res !== undefined) {
            ret.fieldnames.children.push(res);
         }
      }
      return ret;
   }
}

export class SameTableComputedFieldMapping extends FieldMapping {
   constructor(
      tableDef: Readonly<TableDef>,
      protected readonly fieldname: string,
      protected readonly toDbConvert: ToDbSqlConverter<unknown>,
      protected readonly toDomainConvert: (o: unknown) => unknown | undefined,
   ) {
      super(tableDef);
   }

   processField(domainFieldname: string, value: boolean): ProcessResult {
      const dbAlias = createSqlAlias(this.tableDef.name, this.fieldname);
      const dbFullFieldName = `${this.toDbConvert.prepare(value)} AS ${dbAlias}`;
      const ret: ProcessResult = {
         fieldnames: {
            children: [
               {
                  domain: domainFieldname,
                  toDomainConvert: this.toDomainConvert,
                  dbAlias,
                  dbFullFieldName,
               },
            ],
            rootDomain: { name: domainFieldname, type: 'value' },
         },
         tablename: this.tableDef.name,
         joins: [],
      };
      return ret;
   }

   processAllFilters<T>(
      domainFieldname: Extract<keyof T, string>,
      domainFilters: FilterArrayType<T>,
      errors: string[],
      dialect: Dialect = defaultDialect,
   ): { or: string[]; and: string[]; joins: string[] } {
      const ret: { or: string[]; and: string[]; joins: string[] } = { or: [], and: [], joins: [] };

      if (domainFilters !== undefined) {
         const comparison = domainFilters[domainFieldname];
         if (comparison !== undefined && isComputedComparison(comparison)) {
            const comparisonMapper = comparisonOperatorMap[comparison.operator];
            try {
               const values = this.toDbConvert.convert(comparison.data);
               ret.and.push(comparisonMapper.format(toSqlNumbers(comparison.value), values, this.toDbConvert, dialect));
            } catch (e) {
               errors.push(invalidFilterValue(domainFieldname, e));
               ret.and.push(matchNothing);
            }
         } else {
            errors.push(`cannot find comparison operator for domain field name [${domainFieldname}]`);
         }
      }
      return ret;
   }

   getOrderBy(o: Options<string>): string[] {
      return [`${this.tableDef.name}.${this.fieldname} ${o.orderby?.sort === 'desc' ? 'desc' : 'asc'}`];
   }
}

export class OneToOneTableMapping<T extends string> extends FieldMapping {
   constructor(
      tableDef: Readonly<TableDef>,
      protected readonly mapping: TableMapping<T>,
      protected readonly linkedFieldname: string,
   ) {
      super(tableDef);
   }

   processField(domainFieldname: string, value: RequestableFields<unknown>): ProcessResult {
      const ret: ProcessResult = {
         fieldnames: { rootDomain: { name: domainFieldname, type: 'object' }, children: [] },
         tablename: this.tableDef.name,
         joins: [this.buildJoin()],
      };
      for (const domFieldname in value) {
         const tmap = this.mapping[domFieldname as T] as FieldMapping;
         const res = tmap.processField(domFieldname, value[domFieldname as T]);
         if (res !== undefined) {
            ret.fieldnames.children.push(res);
         }
      }
      return ret;
   }

   private buildJoin(): string {
      return `JOIN ${this.tableDef.name} ON ${this.tableDef.name}.${this.tableDef.primaryKey} = ${this.linkedFieldname}`;
   }

   processAllFilters<T>(
      domainFieldname: Extract<keyof T, string>,
      domainFilters: FilterArrayType<T>,
      errors: string[],
      dialect: Dialect = defaultDialect,
   ): { or: string[]; and: string[]; joins: string[] } {
      return otherTableProcessAllFilters(
         domainFieldname,
         domainFilters,
         this.mapping,
         this.buildJoin(),
         errors,
         dialect,
      );
   }

   getOrderBy(o: Options<T>): string[] {
      const ret: string[] = [];

      if (o.orderby !== undefined) {
         const fieldMap = this.mapping[o.orderby.fieldname];
         if (fieldMap === undefined) {
            // errors.push(`cannot find db mapping for domain field name [${o.orderby.fieldname}]`);
         } else {
            const orderbys = fieldMap.getOrderBy(o);
            ret.push(...orderbys);
         }
      }

      return ret;
   }

   processOneToMany(
      domainFieldname: string,
      value: RequestableFields<unknown>,
      errors: string[] = [],
   ): ProcessOneToManyResult | undefined {
      const joins: Set<string> = new Set();
      joins.add(this.buildJoin());
      const fieldnames: ProcessOneToManyResult['fieldnames'] = {
         children: [],
         rootDomain: { name: domainFieldname, type: 'object' },
      };
      // return undefined
      for (const key in value) {
         const map = this.mapping[key as T] as FieldMapping;
         if (map === undefined) {
            errors.push(missingPersistenceMapping(key, this.tableDef.name));
            continue;
         }
         const res = map.processOneToMany(key, value[key as T], errors);
         if (res !== undefined) {
            fieldnames.children.push(res);
         }
      }

      return {
         fieldnames,
         tablename: this.tableDef.name,
         joins: [...joins],
      };
   }
}

export class OneToManyTableMapping<T extends string> extends FieldMapping {
   constructor(
      tableDef: Readonly<OneToManyTableDef>,
      protected readonly mapping: TableMapping<T>,
   ) {
      super(tableDef);
   }

   private buildJoin(): string {
      const td: OneToManyTableDef = this.tableDef as OneToManyTableDef;
      return `LEFT JOIN ${td.name} ON ${td.name}.${td.foreign.keyName} = ${td.foreign.otherTable.name}.${td.foreign.otherTable.primaryKey}`;
   }

   processOneToMany(
      domainFieldname: string,
      value: RequestableFields<unknown>,
      errors: string[] = [],
   ): ProcessOneToManyResult | undefined {
      const joins: Set<string> = new Set();
      joins.add(this.buildJoin());
      const fieldnames: ProcessOneToManyResult['fieldnames'] = {
         children: [],
         rootDomain: { name: domainFieldname, type: 'array' },
      };
      for (const key in value) {
         const map = this.mapping[key as T] as FieldMapping;
         if (map === undefined) {
            errors.push(missingPersistenceMapping(key, this.tableDef.name));
            continue;
         }
         const res =
            map instanceof OneToManyTableMapping
               ? map.processOneToMany(key, value[key as T] as RequestableFields<unknown>, errors)
               : map.processField(key, value[key as T]);
         if (res !== undefined && map instanceof OneToManyTableMapping) {
            // an inner join in the nested one to many would remove the elements of this one without nested element
            useLeftJoins(res);
         }
         if (res !== undefined) {
            fieldnames.children.push(res);
            res.joins.forEach((v) => joins.add(v));
         }
      }

      return {
         fieldnames,
         tablename: this.tableDef.name,
         primaryKey: this.tableDef.primaryKey,
         joins: [...joins],
      };
   }

   processAllFilters<T>(
      domainFieldname: Extract<keyof T, string>,
      domainFilters: FilterArrayType<T>,
      errors: string[],
      dialect: Dialect = defaultDialect,
   ): { or: string[]; and: string[]; joins: string[] } {
      return otherTableProcessAllFilters(
         domainFieldname,
         domainFilters,
         this.mapping,
         this.buildJoin(),
         errors,
         dialect,
      );
   }
}

function missingPersistenceMapping(domainKey: string, tableName: string): string {
   return `inconsistency between domain mapping and persistence mapping: cannot find domain key [${domainKey}] in persistence mapping of [${tableName}]`;
}

function useLeftJoins(pr: ProcessResult): void {
   pr.joins = pr.joins.map((join) => (join.startsWith('JOIN ') ? `LEFT ${join}` : join));
   for (const child of pr.fieldnames.children) {
      if (!isChild(child)) {
         useLeftJoins(child);
      }
   }
}

// the value of a computed comparison is written as is in the sql, so nothing else than numbers is accepted
function toSqlNumbers(value: unknown): string {
   return (Array.isArray(value) ? value : [value])
      .map((v) => {
         if (typeof v !== 'number' || !Number.isFinite(v)) {
            throw new Error(`[${v}] is not a number`);
         }
         return v;
      })
      .join(',');
}

function otherTableProcessAllFilters<T>(
   domainFieldname: Extract<keyof T, string>,
   domainFilters: FilterArrayType<T>,
   mapping: TableMapping<string>,
   join: string,
   errors: string[],
   dialect: Dialect,
): { or: string[]; and: string[]; joins: string[] } {
   const ret: { or: string[]; and: string[]; joins: string[] } = { or: [], and: [], joins: [join] };

   if (domainFilters === undefined) {
      return ret;
   }
   const filter = domainFilters[domainFieldname];
   if (filter !== undefined && isFilteringFields(filter)) {
      const { or, and, joins } = processAllFilters(filter, mapping, errors, dialect);

      ret.or.push(...or);
      ret.and.push(...and);
      ret.joins.push(...joins);
   } else {
      errors.push(`cannot find comparison operator for domain field name [${domainFieldname}]`);
   }

   return ret;
}

export class OneToOneFieldMapping<T extends string> extends FieldMapping {
   constructor(
      tableDef: Readonly<TableDef>,
      private readonly field: string,
      private readonly toDbConvert: ToDbSqlConverter<unknown>,
      private readonly toDomainConvert: (o: unknown) => unknown | undefined,
      private readonly tableName: string,
      private readonly foreignKey: string,
      private readonly nullable: boolean,
   ) {
      super(tableDef);
   }

   processField(domainFieldname: string, _value: RequestableFields<T>): ProcessResult {
      const ret: ProcessResult = {
         fieldnames: {
            rootDomain: { name: domainFieldname, type: 'value' },
            children: [
               {
                  // db: this.field,
                  domain: domainFieldname,
                  toDomainConvert: this.toDomainConvert,
                  dbAlias: createSqlAlias(this.tableDef.name, this.field),
                  dbFullFieldName: createRequestFullFieldName(this.tableDef.name, this.field),
               },
            ],
         },
         tablename: this.tableDef.name,
         joins: [this.buildJoin()],
      };
      return ret;
   }

   processAllFilters<T>(
      domainFieldname: Extract<keyof T, string>,
      domainFilters: FilterArrayType<T>,
      errors: string[],
      dialect: Dialect = defaultDialect,
   ): { or: string[]; and: string[]; joins: string[] } {
      const res = sameTableProcessAllFilters(
         domainFieldname,
         domainFilters,
         `${this.tableDef.name}.${this.field}`,
         this.toDbConvert,
         errors,
         dialect,
      );
      res.joins.push(this.buildJoin());
      return res;
   }

   private buildJoin(): string {
      return `${this.nullable ? 'LEFT ' : ''}JOIN ${this.tableDef.name} ON ${this.tableDef.name}.${
         this.tableDef.primaryKey
      } = ${this.tableName}.${this.foreignKey}`;
   }
}

function sameTableProcessAllFilters<T>(
   domainFieldname: Extract<keyof T, string>,
   domainFilters: FilterArrayType<T>,
   fullFieldName: string,
   toDbConvert: ToDbSqlConverter<unknown>,
   errors: string[],
   dialect: Dialect,
): { or: string[]; and: string[]; joins: string[] } {
   const ret: { or: string[]; and: string[]; joins: string[] } = { or: [], and: [], joins: [] };

   if (domainFilters !== undefined) {
      const comparison = domainFilters[domainFieldname];
      if (comparison !== undefined && isComparison(comparison)) {
         const comparisonMapper = comparisonOperatorMap[comparison.operator];
         try {
            const values = toDbConvert.convert(comparison.value);
            ret.and.push(comparisonMapper.format(fullFieldName, values, toDbConvert, dialect));
         } catch (e) {
            errors.push(invalidFilterValue(domainFieldname, e));
            ret.and.push(matchNothing);
         }
      } else {
         errors.push(`cannot find comparison operator for domain field name [${domainFieldname}]`);
      }
   }
   return ret;
}

// a filter with a value which cannot be converted must not widen the results, so it matches nothing
const matchNothing = '1 = 0';

function invalidFilterValue(domainFieldname: string, e: unknown): string {
   return `invalid filter value for domain field name [${domainFieldname}]: ${e instanceof Error ? e.message : e}`;
}

type DatabaseOperator = '=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'LIKE BINARY' | 'IN' | 'BETWEEN';

function commonFormat(
   field: string,
   operator: DatabaseOperator,
   values: unknown[],
   converter: ToDbSqlConverter<unknown>,
   deco?: string,
): string {
   return values.map((v) => converter.buildInstruction(field, operator, converter.prepare(v, deco))).join(' OR ');
}

type ComparisonOperatorMap = {
   [key in Operator]: {
      format: (field: string, values: unknown[], converter: ToDbSqlConverter<unknown>, dialect: Dialect) => string;
   };
};

// "LIKE" ignores the case or not depending on the collation of the column (mysql) or on the engine (sqlite),
// so each dialect has its own form to get the same result: contains is case sensitive, icontains is not
function containsFormat(
   field: string,
   values: unknown[],
   converter: ToDbSqlConverter<unknown>,
   dialect: Dialect,
): string {
   if (dialect === 'sqlite') {
      // the LIKE of sqlite ignores the case of the ascii letters, instr does not and needs no escaping
      return values.map((v) => `instr(${field}, ${converter.prepare(v)}) > 0`).join(' OR ');
   }
   // mysql: BINARY forces a comparison of the bytes, whatever the (usually case insensitive) collation of the column
   const operator = dialect === 'mysql' ? 'LIKE BINARY' : 'LIKE';
   return commonFormat(field, operator, values, converter, '%');
}

function icontainsFormat(field: string, values: unknown[], converter: ToDbSqlConverter<unknown>): string {
   return values
      .map((v) => converter.buildInstruction(`LOWER(${field})`, 'LIKE', lowerPrepared(converter.prepare(v, '%'))))
      .join(' OR ');
}

// the escape clause must stay out of LOWER()
function lowerPrepared(prepared: unknown): string {
   const sql = String(prepared);
   return sql.endsWith(likeEscapeClause)
      ? `LOWER(${sql.slice(0, -likeEscapeClause.length)})${likeEscapeClause}`
      : `LOWER(${sql})`;
}

const comparisonOperatorMap: ComparisonOperatorMap = {
   equals: {
      format: (field: string, values: unknown[], converter: ToDbSqlConverter<unknown>): string =>
         commonFormat(field, '=', values, converter),
   },
   greaterThan: {
      format: (field: string, values: unknown[], converter: ToDbSqlConverter<unknown>): string =>
         commonFormat(field, '>', values, converter),
   },
   greaterThanOrEquals: {
      format: (field: string, values: unknown[], converter: ToDbSqlConverter<unknown>): string =>
         commonFormat(field, '>=', values, converter),
   },
   lesserThan: {
      format: (field: string, values: unknown[], converter: ToDbSqlConverter<unknown>): string =>
         commonFormat(field, '<', values, converter),
   },
   lesserThanOrEquals: {
      format: (field: string, values: unknown[], converter: ToDbSqlConverter<unknown>): string =>
         commonFormat(field, '<=', values, converter),
   },
   contains: {
      format: containsFormat,
   },
   icontains: {
      format: icontainsFormat,
   },
   between: {
      format: (field: string, values: unknown[], converter: ToDbSqlConverter<unknown>): string => {
         const buildInstruction = (v: unknown) => `${field} BETWEEN ${v}`;

         if (values.length === 1) {
            const v = converter.prepare(values[0]);
            return buildInstruction(`${v} AND ${v}`);
         } else if (values.length >= 2) {
            return buildInstruction(`${converter.prepare(values[0])} AND ${converter.prepare(values[1])}`);
         } else {
            return buildInstruction('0 AND 0');
         }
      },
   },
};
