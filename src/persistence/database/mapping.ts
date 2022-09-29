import { RequestableFields } from '../../domain-request/types.ts';
import { isSomethingLike } from '../../domain-request/type-checkers.ts';
import {
   FilterArrayType,
   isComputedComparison,
   isComparison,
   isFilteringFields,
   Operator,
} from '../../domain-request/field-configuration/types.ts';
import { processAllFilters, createRequestFullFieldName, createSqlAlias } from './functions.ts';
import { ToDbSqlConverter } from './converters.ts';

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

export type ManyToManyTableDef = {
   name: string;
   primaryKey: string;
   foreignKey1: string;
   foreignKey2: string;
};

type Child = {
   domain: string;
   // db: string;
   toDomainConvert: (o: unknown) => unknown | undefined;
   dbAlias: string;
   dbFullFieldName: string;
};
export function isChild(o: unknown): o is Child {
   return (
      isSomethingLike<Child>(o) && o.domain !== undefined && o.dbAlias !== undefined && o.dbFullFieldName !== undefined
   );
}

export type DomainPath = { name: string; type: 'array' | 'object' | 'value' };
export type FieldNames = {
   rootDomain: DomainPath;
   children: Array<Child | ProcessResult>;
};
export type ProcessResult = {
   fieldnames: FieldNames;
   tablename: string;
   joins: string[];
};

export type ProcessFiltersResult = string[];

type ProcessOneToManyResult = ProcessResult;
export abstract class FieldMapping {
   constructor(protected readonly tableDef: Readonly<TableDef>) {}

   processField(_domainFieldname: string, _value: boolean | RequestableFields<unknown>): ProcessResult | undefined {
      return undefined;
   }

   // processFilters(_domainFieldname: string, _filters: FilterArrayType<unknown>): ProcessFiltersResult | undefined {
   //    return undefined;
   // }

   processAllFilters(
      _domainFieldname: string,
      _filters: FilterArrayType<unknown>,
      _errors: string[],
   ): { or: string[]; and: string[]; joins: string[] } {
      return { or: [], and: [], joins: [] };
   }

   processOneToMany(
      _domainFieldname: string,
      _value: boolean | RequestableFields<unknown>,
   ): ProcessOneToManyResult | undefined {
      return undefined;
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
                  // db: this.fieldname,
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

   // processFilters<T>(
   //    domainFieldname: Extract<keyof T, string>,
   //    domainFilters: FilterArrayType<T>,
   // ): ProcessFiltersResult {
   //    const filters: ProcessFiltersResult = [];
   //    if (domainFilters !== undefined) {
   //       const comparison = domainFilters[domainFieldname];
   //       if (comparison !== undefined && isComparison(comparison)) {
   //          const comparisonMapper = comparisonOperatorMap[comparison.operator];
   //          this.toDbConvert.setValue(comparison.value);
   //          filters.push(comparisonMapper.format(`${this.tableDef.name}.${this.fieldname}`, this.toDbConvert));
   //       } else {
   //          console.log('should not be the case');
   //       }
   //    }
   //    return filters;
   // }

   processAllFilters<T>(
      domainFieldname: Extract<keyof T, string>,
      domainFilters: FilterArrayType<T>,
      errors: string[],
   ): { or: string[]; and: string[]; joins: string[] } {
      const ret: { or: string[]; and: string[]; joins: string[] } = { or: [], and: [], joins: [] };

      if (domainFilters !== undefined) {
         const comparison = domainFilters[domainFieldname];
         if (comparison !== undefined && isComparison(comparison)) {
            const comparisonMapper = comparisonOperatorMap[comparison.operator];
            this.toDbConvert.setValue(comparison.value);
            ret.and.push(comparisonMapper.format(`${this.tableDef.name}.${this.fieldname}`, this.toDbConvert));
         } else {
            errors.push(`cannot find comparison operator for domain field name [${domainFieldname}]`);
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
                  // db: this.fieldname,
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
   ): { or: string[]; and: string[]; joins: string[] } {
      const ret: { or: string[]; and: string[]; joins: string[] } = { or: [], and: [], joins: [] };

      if (domainFilters !== undefined) {
         const comparison = domainFilters[domainFieldname];
         if (comparison !== undefined && isComputedComparison(comparison)) {
            const comparisonMapper = comparisonOperatorMap[comparison.operator];
            this.toDbConvert.setValue(comparison.data);
            ret.and.push(comparisonMapper.format(`${comparison.value}`, this.toDbConvert));
         } else {
            errors.push(`cannot find comparison operator for domain field name [${domainFieldname}]`);
         }
      }
      return ret;
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
         const tmap = (this.mapping as any)[domFieldname] as FieldMapping;
         const res = tmap.processField(domFieldname, (value as any)[domFieldname]);
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
   ): { or: string[]; and: string[]; joins: string[] } {
      const ret: { or: string[]; and: string[]; joins: string[] } = { or: [], and: [], joins: [this.buildJoin()] };

      if (domainFilters === undefined) {
         return ret;
      }
      const filter = domainFilters[domainFieldname];
      if (filter !== undefined && isFilteringFields(filter)) {
         const { or, and, joins } = processAllFilters(filter, this.mapping, errors);

         ret.or.push(...or);
         ret.and.push(...and);
         ret.joins.push(...joins);
      } else {
         errors.push(`cannot find comparison operator for domain field name [${domainFieldname}]`);
      }

      return ret;
   }
}

export class OneToManyTableMapping<T extends string> extends FieldMapping {
   constructor(tableDef: Readonly<OneToManyTableDef>, protected readonly mapping: TableMapping<T>) {
      super(tableDef);
   }

   private buildJoin(): string {
      const td: OneToManyTableDef = this.tableDef as OneToManyTableDef;
      return `JOIN ${td.name} ON ${td.name}.${td.foreign.keyName} = ${td.foreign.otherTable.name}.${td.foreign.otherTable.primaryKey}`;
   }

   processOneToMany(domainFieldname: string, value: RequestableFields<unknown>): ProcessOneToManyResult | undefined {
      const joins: Set<string> = new Set();
      joins.add(this.buildJoin());
      const fieldnames: ProcessOneToManyResult['fieldnames'] = {
         children: [],
         rootDomain: { name: domainFieldname, type: 'array' },
      };
      for (const key in value) {
         const map = (this.mapping as any)[key] as FieldMapping;
         if (map === undefined) {
            console.log(
               `inconsistency between domain mapping and persistence mapping: cannot find domain key [${key}] in persistence mapping of [${this.tableDef.name}]`,
            );
            continue;
         }
         const res = map.processField(key, (value as any)[key]);
         if (res !== undefined) {
            fieldnames.children.push(res);
            res.joins.forEach((v) => joins.add(v));
         }
      }

      return {
         fieldnames,
         tablename: this.tableDef.name,
         joins: [...joins],
      };
   }
}

export class OneToOneFieldMapping<T extends string> extends FieldMapping {
   constructor(
      tableDef: Readonly<TableDef>,
      private readonly field: string,
      private readonly toDbConvert: ToDbSqlConverter<unknown>,
      private readonly toDomainConvert: (o: unknown) => unknown | undefined,
      private readonly tableName: string,
      private readonly foreignKey: string,
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
         joins: [
            `JOIN ${this.tableDef.name} ON ${this.tableDef.name}.${this.tableDef.primaryKey} = ${this.tableName}.${this.foreignKey}`,
         ],
      };
      return ret;
   }
}

type DatabaseOperator = '=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'IN' | 'BETWEEN';

function commonFormat(
   field: string,
   operator: DatabaseOperator,
   converter: ToDbSqlConverter<unknown>,
   deco?: string,
): string {
   return converter
      .getValue()
      .map((v) => converter.buildInstruction(field, operator, converter.prepare(v, deco)))
      .join(' OR ');
}

type ComparisonOperatorMap = {
   [key in Operator]: {
      format: (field: string, converter: ToDbSqlConverter<unknown>) => string;
   };
};

const comparisonOperatorMap: ComparisonOperatorMap = {
   equals: {
      format: (field: string, converter: ToDbSqlConverter<unknown>): string => commonFormat(field, '=', converter),
   },
   greaterThan: {
      format: (field: string, converter: ToDbSqlConverter<unknown>): string => commonFormat(field, '>', converter),
   },
   greaterThanOrEquals: {
      format: (field: string, converter: ToDbSqlConverter<unknown>): string => commonFormat(field, '>=', converter),
   },
   lesserThan: {
      format: (field: string, converter: ToDbSqlConverter<unknown>): string => commonFormat(field, '<', converter),
   },
   lesserThanOrEquals: {
      format: (field: string, converter: ToDbSqlConverter<unknown>): string => commonFormat(field, '<=', converter),
   },
   contains: {
      format: (field: string, converter: ToDbSqlConverter<unknown>): string =>
         commonFormat(field, 'LIKE', converter, '%'),
   },
   between: {
      format: (field: string, converter: ToDbSqlConverter<unknown>): string => {
         const buildInstruction = (v: unknown) => `${field} BETWEEN ${v}`;

         const values = converter.getValue();
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
