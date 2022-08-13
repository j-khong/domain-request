/* eslint-disable @typescript-eslint/brace-style */
import {
   DomainExpandables,
   DomainFields,
   NestedFilteringFields,
   NestedRequestableFields,
   Operator,
} from '../../DomainRequest/index.ts';
import { SimpleDatabaseTable } from './simple.ts';

// can be an id (string | number) but also an ids list (1,45,3) to be used with IN ()
// export const toTableId = (o: any): number[] => o.split(',').map((n: string) => toNumber(n));

const toNumber = (o: any): number => {
   const r = Number.parseFloat(o);
   if (isNaN(r)) {
      return 0;
   }
   return r;
};

// export const toNumberOrRange = (val: { o: any; op: Operator }): string => {
//    if (Array.isArray(val.o)) {
//       if (val.op === 'between') {
//          return `'${toNumber(val.o[0])}' AND '${toNumber(val.o[1])}'`;
//       } else {
//          return `(${val.o.map((n: string) => toNumber(n)).join(', ')})`;
//       }
//    } else {
//       return `'${toNumber(val.o)}'`;
//    }
// };

// export const toStringOrArray = (o: any): string | string[] => {
//    if (Array.isArray(o) && o.length > 1) {
//       return o.map((n: unknown) => `'${(n as any).toString()}'`);
//    } else {
//       return `'${o.toString()}'`;
//    }
// };

// export const toNumberOrArray = (o: any): number | number[] => {
//    if (Array.isArray(o) && o.length > 1) {
//       return o.map((n: unknown) => toNumber(n));
//    } else {
//       return toNumber(o);
//    }
// };

// export const toBoolean = (o: any): string => `${Number(o)}`;
// export const toString = (o: any, op: Operator): string => `'${o.toString()}'`;

// export const toDatetimeOrRange = (o: Date): string => {
//    if (Array.isArray(o) && o.length > 1) {
//       return `'${fromDatetimeToMysqlDatetime(o[0])}' AND '${fromDatetimeToMysqlDatetime(o[1])}'`;
//    } else {
//       return `'${fromDatetimeToMysqlDatetime(o)}'`;
//    }
// };

// export const toDateOrArray = (o: unknown): string | string[] => {
//    if (Array.isArray(o) && o.length > 1) {
//       return o.map((v: unknown) => `'${fromDateToMysqlDate(v as Date)}'`);
//    } else {
//       return `'${fromDateToMysqlDate(o as Date)}'`;
//    }
// };

export interface SameTableMapping<TableFields extends string> {
   name: TableFields;
   convertToDb: ToDbSqlConverter<unknown>; //(o: any) => number | number[] | string | string[];
   convertToDomain: (o: any) => any;
   convertToCompute: (o: any) => string;
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
type DomainFieldsToTableFieldsMap<DomainFields, TableFields extends string> = {
   [Property in keyof DomainFields]: SameTableMapping<TableFields>;
};

export type DomainToDbTableMapping<F, TB> = {
   [Property in keyof F]: {
      tableFieldname: Extract<keyof TB, string>;
      convertToSqlInstructionPart: ToDbSqlConverter<unknown>;
      convertToDomain: (o: unknown) => F[Property];
   };
};

export abstract class ToDbSqlConverter<OriginalType> {
   constructor(private readonly typeConverter: (o: unknown) => OriginalType) {}

   private value: OriginalType[] | undefined;
   setValue(value: unknown): void {
      if (Array.isArray(value)) {
         this.value = value.map((n: unknown) => this.typeConverter(n));
      } else this.value = [this.typeConverter(value)];
   }

   getValue(): OriginalType[] {
      if (this.value === undefined) {
         throw new Error('program error value not set');
      }
      return this.value;
   }

   abstract prepare(v: OriginalType, deco?: string): unknown;
}

export class ToDbSqlStringConverter extends ToDbSqlConverter<string> {
   constructor(typeConverter: (o: unknown) => string = (o: unknown) => (o as any).toString()) {
      super(typeConverter);
   }

   prepare(v: string, deco = ''): string {
      return `'${deco}${v}${deco}'`;
   }
}

export class ToDbSqlNumberConverter extends ToDbSqlConverter<number> {
   constructor(typeConverter: (o: unknown) => number = toNumber) {
      super(typeConverter);
   }

   prepare(v: number, deco?: string): string | number {
      if (deco !== undefined) {
         return `'${deco}${v}${deco}'`;
      }
      return v;
   }
}

export class ToDbSqlDateConverter extends ToDbSqlStringConverter {
   constructor() {
      super(fromDateToMysqlDate);
   }
}

export class ToDbSqlDatetimeConverter extends ToDbSqlStringConverter {
   constructor() {
      super(fromDatetimeToMysqlDatetime);
   }
}

export class ToDbSqlBooleanConverter extends ToDbSqlNumberConverter {
   constructor() {
      super((o: unknown): number => Number(o));
   }
}

export function buildMapping<F, T>(
   m: DomainToDbTableMapping<F, T>,
): DomainFieldsToTableFieldsMap<F, Extract<keyof T, string>> {
   const res = {} as DomainFieldsToTableFieldsMap<F, Extract<keyof T, string>>;

   for (const k in m) {
      const key = k as keyof F;
      res[key] = buildSameTableMapping<Extract<keyof T, string>>(
         m[key].tableFieldname,
         m[key].convertToSqlInstructionPart,
         m[key].convertToDomain,
      );
   }

   return res;
}

export function createFieldMapping<F, T>(
   domainField: keyof F, //Extract<keyof F, string>,
   tableField: Extract<keyof T, string>,
   toSql: ToDbSqlConverter<unknown>,
   toDomain: (o: unknown) => F[typeof domainField],
): DomainToDbTableMapping<Pick<F, typeof domainField>, Pick<T, typeof tableField>> {
   const res = {} as DomainToDbTableMapping<Pick<F, typeof domainField>, Pick<T, typeof tableField>>;
   // DomainToDbTableMapping<Pick<F, Extract<keyof F, string>>, Pick<T, Extract<keyof T, string>>> {
   //    const res = {} as DomainToDbTableMapping<Pick<F, Extract<keyof F, string>>, Pick<T, Extract<keyof T, string>>>;
   res[domainField] = {
      tableFieldname: tableField,
      convertToSqlInstructionPart: toSql,
      convertToDomain: toDomain,
   };
   return res;
}

export function buildSameTableMapping<TableFields extends string>(
   name: TableFields,
   convertToDb: ToDbSqlConverter<unknown>, //(o: any) => number | number[] | string | string[],
   convertToDomain: (o: any) => any = (o: any) => o,
   convertToCompute: (o: any) => string = (o: any) => o.toString(),
): SameTableMapping<TableFields> {
   return {
      name,
      convertToDb,
      convertToDomain,
      convertToCompute,
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

export function buildExpandablesToTableMapping<DRN extends string, E extends DomainExpandables, TF extends string>(v: {
   localContextDomainName?: keyof E;
   allDbTables: {
      [Property in DRN]: SimpleDatabaseTable<DRN, any, any>;
   };
   cardinality: Cardinality<TF>;
   globalContextDomainName: DRN;
}): DomainExpandableFieldsToTableFields<TF> {
   const { localContextDomainName, allDbTables, cardinality, globalContextDomainName } = v;

   const dbTable = allDbTables[globalContextDomainName ?? (localContextDomainName as DRN)];
   if (dbTable === undefined) {
      throw new Error(
         `please give the globalContextDomainName as localContextDomainName ${
            localContextDomainName as string
         } is different`,
      );
   }
   return {
      cardinality,
      tableConfig: dbTable.getTableConfig(),
      dbt: dbTable,
      globalContextDomainName,
   };
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

export interface IsExpandablesTableConfig<F, E, TF extends string> {
   getDomainExpandableFieldsToTableFieldsMap: () => DomainExpandableFieldsToTableFieldsMap<E, TF>;
   getDomainFieldsToTableFieldsMap: () => DomainFieldsToTableFieldsMap<F, TF>;
   getTableName: () => string;
   getTablePrimaryKey: () => string;
}
export class ExpandablesTableConfig<Fields, ExpandableFields, TableFields extends string>
   extends SimpleTableConfig<Fields, TableFields>
   implements IsExpandablesTableConfig<Fields, ExpandableFields, TableFields>
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

   getDomainFieldsToTableFieldsMap(): DomainFieldsToTableFieldsMap<Fields, TableFields> {
      return this.domainFieldsToTableFieldsMap;
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
   implements
      IsExpandablesTableConfig<Fields, ExpandableFields, TableFields>,
      IsExtendableTableConfig<Extended, TableFields>
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

   getDomainFieldsToTableFieldsMap(): DomainFieldsToTableFieldsMap<Fields, TableFields> {
      return this.domainFieldsToTableFieldsMap;
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

function fromDatetimeToMysqlDatetime(input: unknown): string {
   const d = getFunctionalDate(input);

   const formattedDate = fromDateToMysqlDate(d);
   const time = [d.getHours(), d.getMinutes(), d.getSeconds()];
   return `${formattedDate} ${time.map((v) => format2digits(v)).join(':')}`;
}

function fromDateToMysqlDate(input: unknown): string {
   const d = getFunctionalDate(input);
   const date = [d.getFullYear(), format2digits(d.getMonth() + 1), format2digits(d.getDate())];
   return date.join('-');
}

function getFunctionalDate(input: unknown): Date {
   let d = new Date(input as string);
   if (isNaN(d.getTime())) {
      d = new Date();
   }
   return d;
}

function format2digits(val: number): string {
   return String(val).padStart(2, '0');
}

export class ValueMapper<DbValues, DomainValues> {
   private readonly domainToDb: Map<DomainValues, DbValues>;
   constructor(private readonly dbToDomain: Map<DbValues, DomainValues>) {
      this.domainToDb = new Map<DomainValues, DbValues>(Array.from(dbToDomain, (a) => [a[1], a[0]]));
   }

   toDbValue(o: DomainValues, defaultValue?: DbValues): DbValues {
      const res = this.domainToDb.get(o);
      if (undefined === res) {
         if (defaultValue !== undefined) {
            return defaultValue;
         }
         throw new Error(`unmanaged value [${o}]`);
      }

      return res;
   }

   toDomainValue(o: DbValues, defaultValue?: DomainValues): DomainValues {
      const res = this.dbToDomain.get(o);
      if (undefined === res) {
         if (defaultValue !== undefined) {
            return defaultValue;
         }
         throw new Error(`unmanaged db status [${o}]`);
      }

      return res;
   }
}
