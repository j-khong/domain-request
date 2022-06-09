/* eslint-disable @typescript-eslint/brace-style */
import { DomainFields, NestedFilteringFields, NestedRequestableFields } from '../../DomainRequest';
import { SimpleDatabaseTable } from './simple';

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
   convertToDb: (o: any) => number | string | number[];
   convertToDomain: (o: any) => any;
}
export interface OtherTableMapping<TableFields extends string> {
   tableConfig: SimpleTableConfig<any, any>;
   cardinality: Cardinality<TableFields>;
}

export function isSameTableMapping<TableFields extends string>(o: any): o is SameTableMapping<TableFields> {
   return o.name !== undefined && o.convertToDb !== undefined;
}
export function isOtherTableMapping<TableFields extends string>(o: any): o is OtherTableMapping<TableFields> {
   return o.tableConfig !== undefined && o.cardinality !== undefined;
}
export type DomainFieldsToTableFieldsMap<DomainFields, TableFields extends string> = {
   [Property in keyof DomainFields]: SameTableMapping<TableFields>;
};

export function buildSameTableMapping<TableFields extends string>(
   name: TableFields,
   convertToDb: (o: any) => number | string | number[],
   convertToDomain: (o: any) => any = (o: any) => o,
): SameTableMapping<TableFields> {
   return {
      name,
      convertToDb,
      convertToDomain,
   };
}

export type ExtendedDomainFieldsToTableFieldsMap<DomainFields, TableFields extends string> = {
   [Property in keyof DomainFields]: OtherTableMapping<TableFields>;
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
   tableConfig: SimpleTableConfig<any, any>;
   dbt: SimpleDatabaseTable<any, any, TableFields>;
   cardinality: Cardinality<TableFields>;
   globalContextDomainName?: string; // when your Domain expandable name is different from the Domain name (wihch is unique)
}

export function buildExpandablesToTableMapping<DRN extends string, E extends DomainFields, TF extends string>(v: {
   localContextDomainName: keyof E;
   allDbTables: {
      [Property in DRN]: SimpleDatabaseTable<DRN, any, any>;
   };
   cardinality: Cardinality<TF>;
   globalContextDomainName?: DRN;
}): DomainExpandableFieldsToTableFieldsMap<E, TF> {
   const { localContextDomainName, allDbTables, cardinality, globalContextDomainName } = v;

   const dbTable = allDbTables[globalContextDomainName ?? (localContextDomainName as DRN)];
   if (dbTable === undefined) {
      throw new Error(
         `please give the globalContextDomainName as localContextDomainName ${
            localContextDomainName as string
         } is different`,
      );
   }
   const o: any = {};
   o[localContextDomainName] = {
      cardinality,
      tableConfig: dbTable.getTableConfig(),
      dbt: dbTable,
      globalContextDomainName,
   };
   return o;
}

export type DomainExpandableFieldsToTableFieldsMap<ExpandableFields extends DomainFields, TableFields extends string> =
   | {
        [Property in keyof ExpandableFields]: DomainExpandableFieldsToTableFields<TableFields>;
     };

export interface DbRecord {
   [key: string]: string | number | Date | boolean;
}
export type SelectMethodResult = DbRecord[];
export type SelectMethod = (query: string) => Promise<SelectMethodResult>;

export class SimpleTableConfig<Fields, TableFields extends string> {
   constructor(
      public readonly tableName: string,
      public readonly tablePrimaryKey: string,
      public readonly domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields>,
   ) {}

   public select: SelectMethod = async (sql: string) => {
      console.log(`SELECT METHOD is not SET for ${this.tableName}`, sql);
      return [];
   };

   init(select: SelectMethod): void {
      this.select = select;
   }
}

export interface IsExtendableTableConfig<Extended, TableFields extends string> {
   getExtendedFieldsToTableFieldsMap: () => ExtendedDomainFieldsToTableFieldsMap<Extended, TableFields>;
   getTableName: () => string;
   getTablePrimaryKey: () => string;
   getSelect: () => SelectMethod;
}

export class ExtendableTableConfig<Fields, Extended, TableFields extends string>
   extends SimpleTableConfig<Fields, TableFields>
   implements IsExtendableTableConfig<Extended, TableFields>
{
   constructor(
      tableName: string,
      tablePrimaryKey: string,
      domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields>,
      public readonly extendedFieldsToTableFieldsMap: ExtendedDomainFieldsToTableFieldsMap<Extended, TableFields>,
   ) {
      super(tableName, tablePrimaryKey, domainFieldsToTableFieldsMap);
   }

   getExtendedFieldsToTableFieldsMap(): ExtendedDomainFieldsToTableFieldsMap<Extended, TableFields> {
      return this.extendedFieldsToTableFieldsMap;
   }

   getTableName(): string {
      return this.tableName;
   }

   getTablePrimaryKey(): string {
      return this.tablePrimaryKey;
   }

   getSelect(): SelectMethod {
      return this.select;
   }
}

export function isExtendableTableConfig<Fields, TableFields extends string>(
   tc: SimpleTableConfig<Fields, TableFields>,
): tc is ExtendableTableConfig<Fields, any, TableFields> {
   return (tc as any).extendedFieldsToTableFieldsMap !== undefined;
}

export class ExtendedTableConfig<Domain, TableFields extends string> extends SimpleTableConfig<any, TableFields> {
   constructor(
      tableName: string,
      tablePrimaryKey: string,
      domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<any, TableFields>, // TODO a type which can have same mapping or other
      public readonly fromDbRecordsToDomains: (
         dbRecords: Array<{ [key: string]: undefined | any }>,
      ) => Array<NestedFilteringFields<Domain>>,
      public readonly isToSelect: (config: NestedRequestableFields<Domain>, key: TableFields) => boolean,
   ) {
      super(tableName, tablePrimaryKey, domainFieldsToTableFieldsMap);
   }

   private extandableMapping: OtherTableMapping<any> | undefined;
   init(select: SelectMethod, extandableMapping?: OtherTableMapping<any>): void {
      super.init(select);
      this.extandableMapping = extandableMapping;
   }

   getExtandableMapping(): OtherTableMapping<any> {
      if (this.extandableMapping === undefined) {
         throw new Error(
            `Configuration Error : for ExtendedTableConfig of table name ${this.tableName}, extandableMapping is not set`,
         );
      }
      return this.extandableMapping;
   }

   getTableName(fieldname: string): string {
      return this.tableName;
   }

   getAdditionalJoin(): string {
      return '';
   }
}

export class Level2ExtendedTableConfig<Domain, TableFields extends string> extends ExtendedTableConfig<
   Domain,
   TableFields
> {
   constructor(
      private readonly level1Table: {
         tableName: string;
         tablePrimaryKey: string;
         tableForeignKeyToLevel2: string;
      },
      private readonly level2Table: {
         tableName: string;
         tablePrimaryKey: string;
      },
      private readonly fieldnamesByTables: Map<string, TableFields[]>,
      domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<any, TableFields>, // TODO a type which can have same mapping or other
      fromDbRecordsToDomains: (
         dbRecords: Array<{ [key: string]: undefined | any }>,
      ) => Array<NestedFilteringFields<Domain>>,
      isToSelect: (config: NestedRequestableFields<Domain>, key: TableFields) => boolean,
   ) {
      super(
         level1Table.tableName,
         level1Table.tablePrimaryKey,
         domainFieldsToTableFieldsMap,
         fromDbRecordsToDomains,
         isToSelect,
      );
   }

   getAdditionalJoin(): string {
      return `LEFT JOIN ${this.level2Table.tableName} ON ${this.level2Table.tableName}.${this.level2Table.tablePrimaryKey} = ${this.tableName}.${this.level1Table.tableForeignKeyToLevel2}`;
   }

   getTableName(fieldname: TableFields): string {
      for (const [tableName, fieldnames] of this.fieldnamesByTables) {
         if (fieldnames.includes(fieldname)) {
            return tableName;
         }
      }
      // default
      return this.tableName;
   }
}

export interface IsExpandablesTableConfig<E, TF extends string> {
   getDomainExpandableFieldsToTableFieldsMap: () => DomainExpandableFieldsToTableFieldsMap<E, TF>;
   getTableName: () => string;
   getTablePrimaryKey: () => string;
}
export class ExpandablesTableConfig<Fields, ExpandableFields, TableFields extends string>
   extends SimpleTableConfig<Fields, TableFields>
   implements IsExpandablesTableConfig<ExpandableFields, TableFields>
{
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
      select: SelectMethod,
      domainExpandableFieldsToTable?: DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields>,
   ): void {
      super.init(select);
      this.domainExpandableFieldsToTable = domainExpandableFieldsToTable;
   }

   getTableName(): string {
      return this.tableName;
   }

   getTablePrimaryKey(): string {
      return this.tablePrimaryKey;
   }
}

export class ExtendableAndExpandablesTableConfig<Fields, Extended, ExpandableFields, TableFields extends string>
   extends SimpleTableConfig<Fields, TableFields>
   implements IsExpandablesTableConfig<ExpandableFields, TableFields>, IsExtendableTableConfig<Extended, TableFields>
{
   constructor(
      tableName: string,
      tablePrimaryKey: string,
      domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields>,
      public readonly extendedFieldsToTableFieldsMap: ExtendedDomainFieldsToTableFieldsMap<Extended, TableFields>,
   ) {
      super(tableName, tablePrimaryKey, domainFieldsToTableFieldsMap);
   }

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
      select: SelectMethod,
      domainExpandableFieldsToTable?: DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields>,
   ): void {
      super.init(select);
      this.domainExpandableFieldsToTable = domainExpandableFieldsToTable;
   }

   getExtendedFieldsToTableFieldsMap(): ExtendedDomainFieldsToTableFieldsMap<Extended, TableFields> {
      return this.extendedFieldsToTableFieldsMap;
   }

   getTableName(): string {
      return this.tableName;
   }

   getTablePrimaryKey(): string {
      return this.tablePrimaryKey;
   }

   getSelect(): SelectMethod {
      return this.select;
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
