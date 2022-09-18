import { RequestableFields } from '../../../DomainRequest/types.ts';

import { FilterArrayType, isComparison, Operator } from '../../../DomainRequest/new/field-configuration/types.ts';

import { isSomethingLike } from '../../../DomainRequest/type-checkers.ts';
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
   foreignKey: string;
};

export type ManyToManyTableDef = {
   name: string;
   primaryKey: string;
   foreignKey1: string;
   foreignKey2: string;
};

type Child = { domain: string; db: string; toDomainConvert: (o: unknown) => unknown | undefined };
export function isChild(o: unknown): o is Child {
   return isSomethingLike<Child>(o) && o.domain !== undefined && o.db !== undefined;
}
export type FieldNames = { rootDomain: string; children: Array<Child | ProcessResult> };
export type ProcessResult = {
   fieldnames: FieldNames;
   tablename: string;
   joins: string[];
};

export type ProcessFiltersResult = string[];

type ProcessOneToManyResult = {
   fieldnames: { rootDomain: string; children: Array<{ domain: string; db: string }> };
   tablename: string;
   joins: string[];
};
export abstract class FieldMapping {
   constructor(protected readonly tableDef: Readonly<TableDef>) {}

   process(_domainFieldname: string, _value: boolean | RequestableFields<unknown>): ProcessResult | undefined {
      return undefined;
   }

   processFilters(_domainFieldname: string, _filters: FilterArrayType<unknown>): ProcessFiltersResult | undefined {
      return undefined;
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

   process(domainFieldname: string, _value: boolean): ProcessResult {
      const ret = {
         fieldnames: {
            children: [{ db: this.fieldname, domain: domainFieldname, toDomainConvert: this.toDomainConvert }],
            rootDomain: domainFieldname,
         },
         tablename: this.tableDef.name,
         joins: [],
      };
      return ret;
   }

   processFilters<T>(
      domainFieldname: Extract<keyof T, string>,
      domainFilters: FilterArrayType<T>,
   ): ProcessFiltersResult {
      const filters: ProcessFiltersResult = [];
      // console.log('domainFieldname:', domainFieldname);
      // console.log('domainFilters:', domainFilters);
      // console.log('filters:', filters);
      if (domainFilters !== undefined) {
         const comparison = domainFilters[domainFieldname];
         if (comparison !== undefined && isComparison(comparison)) {
            const comparisonMapper = comparisonOperatorMap[comparison.operator];
            this.toDbConvert.setValue(comparison.value);
            filters.push(comparisonMapper.format(`${this.tableDef.name}.${this.fieldname}`, this.toDbConvert));
         } else {
            console.log('should not be the case');
         }
      }
      return filters;
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

   process(domainFieldname: string, value: RequestableFields<unknown>): ProcessResult {
      const ret: ProcessResult = {
         fieldnames: { rootDomain: domainFieldname, children: [] },
         tablename: this.tableDef.name,
         joins: [
            `JOIN ${this.tableDef.name} ON ${this.tableDef.name}.${this.tableDef.primaryKey} = ${this.linkedFieldname}`,
         ],
      };
      for (const domFieldname in value) {
         const tmap = (this.mapping as any)[domFieldname] as FieldMapping;
         const res = tmap.process(domFieldname, (value as any)[domFieldname]);
         if (res !== undefined) {
            ret.fieldnames.children.push(res);
         }
      }
      return ret;
   }

   processFilters<Type>(
      domainFieldname: Extract<keyof Type, string>,
      domainFilters: FilterArrayType<Type>,
   ): ProcessFiltersResult {
      const filters: ProcessFiltersResult = [];
      if (domainFilters === undefined) {
         return filters;
      }
      // const sub = domainFilters.and.find((v) => v[domainFieldname] !== undefined);
      // if (sub === undefined) {
      //    return filters;
      // }
      // for (const domFieldname in sub) {
      //    const tmap = this.mapping[domFieldname as unknown as T] as FieldMapping;
      //    // TODO
      //    //const res = tmap.processFilters(domFieldname, sub);
      //    // if (res !== undefined) {
      //    //    filters.push(...res);
      //    // }
      // }

      return filters;
   }
}

export class OneToManyTableMapping<T extends string> extends FieldMapping {
   constructor(tableDef: Readonly<OneToManyTableDef>, protected readonly mapping: TableMapping<T>) {
      super(tableDef);
   }

   // processOneToMany(
   //    domainFieldname: string,
   //    value: boolean | RequestableFields<unknown>,
   // ): ProcessOneToManyResult | undefined {
   //    if (isBoolean(value)) {
   //       return undefined;
   //    }

   //    console.log('OneToManyTableMapping processOneToMany tableDef:', this.tableDef);
   //    console.log('mapping:', this.mapping);
   //    console.log('domainFieldname:', domainFieldname, value);

   //    const joins: Set<string> = new Set();
   //    const fieldnames: ProcessOneToManyResult['fieldnames'] = {
   //       children: [],
   //       rootDomain: domainFieldname,
   //    };
   //    for (const key in value) {
   //       const map = (this.mapping as any)[key] as FieldMapping;
   //       const res = map.process(key, (value as any)[key],(filters as any)[domFieldname]);
   //       if (res !== undefined) {
   //          console.log('res:', res);
   //          // fieldnames.children.push(...res.fieldnames.children);
   //          // console.log('res.joins:', res.joins);
   //          res.joins.forEach((v) => joins.add(v));
   //          // console.log('joins:', joins);
   //       }
   //    }

   //    return {
   //       fieldnames,
   //       tablename: this.tableDef.name,
   //       joins: [...joins],
   //    };
   // }
}

export class ManyToManyTableMapping<T extends string> extends FieldMapping {
   constructor(tableDef: Readonly<ManyToManyTableDef>, protected readonly mapping: TableMapping<T>) {
      super(tableDef);
   }

   process(domainFieldname: string, value: RequestableFields<T>): ProcessResult {
      const ret = {
         fieldnames: { rootDomain: domainFieldname, children: [] },
         tablename: this.tableDef.name,
         joins: [],
      };
      console.log('domFieldname:', this.mapping);
      for (const domFieldname in value) {
         console.log('domFieldname:', domFieldname);
      }
      return ret;
   }
}

export class OneToOneFieldMapping<T extends string> extends FieldMapping {
   constructor(
      tableDef: Readonly<TableDef>,
      private readonly field: string,
      private readonly tableName: string,
      private readonly foreignKey: string,
   ) {
      super(tableDef);
   }

   process(domainFieldname: string, value: RequestableFields<T>): ProcessResult {
      console.log('=======================');
      const ret = {
         fieldnames: {
            rootDomain: domainFieldname,
            children: [
               {
                  db: this.field,
                  domain: domainFieldname,
                  toDomainConvert: (o: unknown) => {
                     console.log('please implement');
                     return o;
                  },
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
   const buildInstruction = (v: unknown) => `${field} ${operator} ${v}`;

   return converter
      .getValue()
      .map((v) => buildInstruction(converter.prepare(v, deco)))
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
