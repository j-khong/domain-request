import { IsoDate } from '../../domain-request/types.ts';
import { Coordinates } from '../../domain-request/field-configuration/index.ts';
import { isIsoDate, isDate } from '../../domain-request/type-checkers.ts';

const defaultBuildInstruction = (field: string, operator: string, value: unknown) => `${field} ${operator} ${value}`;

export abstract class ToDbSqlConverter<OriginalType> {
   constructor(
      private readonly typeConverter: (o: unknown) => OriginalType,
      public readonly buildInstruction: (
         field: string,
         operator: string,
         value: unknown,
      ) => string = defaultBuildInstruction,
   ) {
      this.buildInstruction = buildInstruction;
   }

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

export class ToDbSqlCoordinatesConverter extends ToDbSqlConverter<Coordinates> {
   constructor(private tableName: string) {
      super(
         (o: unknown) => o as Coordinates,
         (field: string, operator: string, value: unknown): string => `${value} ${operator} ${field}`,
      );
   }

   prepare(coord: Coordinates): string {
      return `( 6371 * acos( cos(radians(${coord.latitude})) * cos(radians(${this.tableName}.latitude)) * cos( radians(${this.tableName}.longitude) - radians(${coord.longitude}) ) + sin(radians(${coord.latitude})) * sin(radians(${this.tableName}.latitude)) ) )`;
   }
}

export class ToDbSqlStringConverter extends ToDbSqlConverter<string> {
   constructor(
      typeConverter: (o: unknown) => string = (o: unknown) => {
         try {
            return (o as { toString: () => string }).toString();
         } catch (_e) {
            return `cannot convert [${o}] to string`;
         }
      },
   ) {
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

const toNumber = (o: unknown): number => {
   try {
      const r = Number.parseFloat((o as { toString: () => string }).toString());
      if (isNaN(r)) {
         return 0;
      }
      return r;
   } catch (_e) {
      return 0;
   }
};

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

export function unknownToString(o: unknown): string | undefined {
   if (o === undefined || o === null) {
      return undefined;
   }
   return String(o);
}

export function unknownToNumber(o: unknown): number | undefined {
   if (o === undefined || o === null) {
      return undefined;
   }
   return Number(o);
}

export function unknownToBoolean(o: unknown): boolean {
   return Boolean(o);
}

export function unknownToIsoDate(o: unknown): IsoDate | undefined {
   if (isDate(o)) {
      return o.toISOString();
   } else if (isIsoDate(o)) {
      return o;
   }
   return undefined;
}
