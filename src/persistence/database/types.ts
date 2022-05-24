import { DomainFields } from '../..';

// can be an id (string | number) but also an ids list (1,45,3) to be used with IN ()
export const toTableId = (o: any): number[] => o.split(',').map((n: string) => toNumber(n));

export const toNumber = (o: any): number => {
   const r = Number.parseFloat(o);
   if (isNaN(r)) {
      return 0;
   }
   return r;
};
export const toBoolean = (o: boolean): string => `${Number(o)}`;
export const toString = (o: string): string => `'${o.toString()}'`;
export const toDate = (o: Date): string => `'${fromDateToMysqlDate(o)}'`;

export interface SameTableMapping<TableFields extends string> {
   name: TableFields;
   convert: (o: any) => number | string | number[];
}
export interface OtherTableMapping<TableFields extends string> {
   tableConfig: TableConfig<any, any, any>;
   cardinality: Cardinality<TableFields>;
}

export function isSameTableMapping<TableFields extends string>(o: any): o is SameTableMapping<TableFields> {
   return o.name !== undefined && o.convert !== undefined;
}
export function isOtherTableMapping<TableFields extends string>(o: any): o is OtherTableMapping<TableFields> {
   return o.tableConfig !== undefined && o.cardinality !== undefined;
}
export type DomainFieldsToTableFieldsMap<DomainFields, TableFields extends string> = {
   [Property in keyof DomainFields]: SameTableMapping<TableFields> | OtherTableMapping<TableFields>;
};

interface OneToOne<TableFields extends string> {
   name: 'oneToOne';
   foreignKey: TableFields;
}

interface OneToMany {
   name: 'oneToMany';
}

type Cardinality<TableFields extends string> = OneToOne<TableFields> | OneToMany;

export interface DomainExpandableFieldsToTableFields<TableFields extends string> {
   tableConfig: TableConfig<any, any, any>;
   cardinality: Cardinality<TableFields>;
   globalContextDomainName?: string; // when your Domain expandable name is different from the Domain name (wihch is unique)
}

export type DomainExpandableFieldsToTableFieldsMap<ExpandableFields extends DomainFields, TableFields extends string> =
   | {
        [Property in keyof ExpandableFields]: DomainExpandableFieldsToTableFields<TableFields>;
     };

export type SelectMethodResult = Array<{ [key: string]: string | number | Date | boolean }>;
export type SelectMethod = (query: string) => Promise<SelectMethodResult>;
export class TableConfig<Fields, ExpandableFields, TableFields extends string, Extended = {}> {
   constructor(
      public readonly tableName: string,
      public readonly tablePrimaryKey: string,
      public readonly domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields>,
      public readonly extendedFieldsToTableFieldsMap?: DomainFieldsToTableFieldsMap<Extended, TableFields>,
   ) {}

   public select: SelectMethod = async (sql: string) => {
      console.log(`SELECT METHOD is not SET for ${this.tableName}`, sql);
      return [];
   };

   private domainExpandableFieldsToTable:
      | DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields>
      | undefined;

   getDomainExpandableFieldsToTableFieldsMap(): DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields> {
      if (this.domainExpandableFieldsToTable === undefined) {
         throw new Error(`domainExpandableFieldsToTable is undefined for ${this.tableName}, call init`);
      }
      return this.domainExpandableFieldsToTable;
   }

   init(
      domainExpandableFieldsToTable: DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields>,
      select?: SelectMethod,
   ): void {
      this.domainExpandableFieldsToTable = domainExpandableFieldsToTable;
      if (select !== undefined) {
         this.select = select;
      }
   }

   public mapper?: (data: Array<{ [key: string]: any }>) => any;
   setMapper(cb: (data: Array<{ [key: string]: any }>) => any): void {
      this.mapper = cb;
   }

   public decider?: (config: any, key: any) => boolean;
   setDecider(cb: (config: any, key: any) => boolean): void {
      // TODO make it mandatory, create a new class and put it in the constructor
      this.decider = cb;
   }
}

function fromDateToMysqlDate(d: Date): string {
   const date = [d.getFullYear(), format2digits(d.getMonth() + 1), format2digits(d.getDate())];
   const time = [d.getHours(), d.getMinutes(), d.getSeconds()];
   return `${date.join('-')} ${time.map((v) => format2digits(v)).join(':')}`;
}

function format2digits(val: number): string {
   return String(val).padStart(2, '0');
}
