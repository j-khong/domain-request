import { RequestableFields } from '../../../DomainRequest/types.ts';
import { isBoolean, isSomethingLike } from '../../../DomainRequest/type-checkers.ts';
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
}

export class OneToManyTableMapping<T extends string> extends FieldMapping {
   constructor(tableDef: Readonly<OneToManyTableDef>, protected readonly mapping: TableMapping<T>) {
      super(tableDef);
   }

   processOneToMany(
      domainFieldname: string,
      value: boolean | RequestableFields<unknown>,
   ): ProcessOneToManyResult | undefined {
      if (isBoolean(value)) {
         return undefined;
      }

      console.log('OneToManyTableMapping processOneToMany tableDef:', this.tableDef);
      console.log('mapping:', this.mapping);
      console.log('domainFieldname:', domainFieldname, value);

      const joins: Set<string> = new Set();
      const fieldnames: ProcessOneToManyResult['fieldnames'] = {
         children: [],
         rootDomain: domainFieldname,
      };
      for (const key in value) {
         const map = (this.mapping as any)[key] as FieldMapping;
         const res = map.process(key, (value as any)[key]);
         if (res !== undefined) {
            console.log('res:', res);
            // fieldnames.children.push(...res.fieldnames.children);
            // console.log('res.joins:', res.joins);
            res.joins.forEach((v) => joins.add(v));
            // console.log('joins:', joins);
         }
      }

      return {
         fieldnames,
         tablename: this.tableDef.name,
         joins: [...joins],
      };
   }
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
