import { RequestableFields } from '../../../DomainRequest/types.ts';
import { isBoolean } from '../../../DomainRequest/type-checkers.ts';
import { ToDbSqlConverter, ToDbSqlStringConverter } from './converters.ts';

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

type ProcessResult = {
   fieldnames: { rootDomain: string; children: Array<{ domain: string; db: string }> };
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

   process(domainFieldname: string, value: boolean | RequestableFields<unknown>): ProcessResult | undefined {
      return undefined;
   }

   processOneToMany(
      domainFieldname: string,
      value: boolean | RequestableFields<unknown>,
   ): ProcessOneToManyResult | undefined {
      return undefined;
   }

   populate(
      toPopulate: { [key: string]: unknown },
      rootDomainFieldname: string,
      domainFieldname: string,
      dbValueToCovnertToDomain: unknown,
   ): void {
      console.log('toPopulate:', toPopulate);
      console.log('rootDomainFieldname:', rootDomainFieldname);
      console.log('domainFieldname:', domainFieldname);
      console.log('dbValueToCovnertToDomain:', dbValueToCovnertToDomain);
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
      return {
         fieldnames: { children: [{ db: this.fieldname, domain: domainFieldname }], rootDomain: domainFieldname },
         tablename: this.tableDef.name,
         joins: [],
      };
   }

   populate(
      toPopulate: { [key: string]: unknown },
      _rootDomainFieldname: string,
      domainFieldname: string,
      dbValueToConvertToDomain: unknown,
   ): void {
      // console.log('toPopulate:', toPopulate);
      // console.log('domainFieldname:', domainFieldname);
      // console.log('dbValueToCovnertToDomain:', dbValueToConvertToDomain);
      toPopulate[domainFieldname] = this.toDomainConvert(dbValueToConvertToDomain) as any;
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
         if (tmap instanceof SameTableMapping) {
            const res = tmap.process(domFieldname, (value as any)[domFieldname]);
            ret.fieldnames.children.push(...res.fieldnames.children);
         }
         // TODO check if there is 1to1 and 1toN
      }
      return ret;
   }

   populate(
      toPopulate: { [key: string]: unknown },
      rootDomainFieldname: string,
      domainFieldname: string,
      dbValueToConvertToDomain: unknown,
   ): void {
      if (toPopulate[rootDomainFieldname] === undefined) {
         toPopulate[rootDomainFieldname] = {};
      }
      // console.log('toPopulate:', toPopulate);
      // console.log('domainFieldname:', domainFieldname);
      // console.log('dbValueToCovnertToDomain:', dbValueToConvertToDomain);
      const tmap = (this.mapping as any)[domainFieldname] as FieldMapping;
      if (tmap instanceof SameTableMapping) {
         tmap.populate(
            toPopulate[rootDomainFieldname] as { [key: string]: unknown },
            domainFieldname,
            domainFieldname,
            dbValueToConvertToDomain,
         );
      }
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
            fieldnames.children.push(...res.fieldnames.children);
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
         fieldnames: { rootDomain: domainFieldname, children: [{ db: this.field, domain: domainFieldname }] },
         tablename: this.tableDef.name,
         joins: [
            `JOIN ${this.tableDef.name} ON ${this.tableDef.name}.${this.tableDef.primaryKey} = ${this.tableName}.${this.foreignKey}`,
         ],
      };
      console.log('domFieldname:', this.tableDef, this.field, this.tableName, this.foreignKey);
      console.log('value:', value);

      return ret;
   }
}
