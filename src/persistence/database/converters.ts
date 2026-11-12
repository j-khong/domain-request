import { IsoDate } from '../../domain-request/types.ts';
import { Coordinates } from '../../domain-request/field-configuration/index.ts';
import { isIsoDate, isDate } from '../../domain-request/type-checkers.ts';
import { createSqlParam } from './params.ts';

const defaultBuildInstruction = (field: string, operator: string, value: unknown) => `${field} ${operator} ${value}`;

// "\" is not usable as it is not handled the same way by all the databases
const likeEscapeChar = '!';

function escapeLikeValue(v: string): string {
   return v.replace(/[!%_]/g, (c) => `${likeEscapeChar}${c}`);
}

export abstract class ToDbSqlConverter<OriginalType> {
   /**
    * @param typeConverter must throw if the value cannot be converted: the filter is then rejected with an error
    */
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

   /**
    * @returns the sql to use as the value: user input must go through createSqlParam, never be concatenated
    */
   abstract prepare(v: OriginalType, deco?: string): unknown;
}

export class ToDbSqlCoordinatesConverter extends ToDbSqlConverter<Coordinates> {
   constructor(private tableName: string) {
      super(
         (o: unknown) => {
            const coord = o as Coordinates;
            if (!isFiniteNumber(coord?.latitude) || !isFiniteNumber(coord?.longitude)) {
               throw new Error(`cannot convert [${JSON.stringify(o)}] to coordinates`);
            }
            return coord;
         },
         (field: string, operator: string, value: unknown): string => `${value} ${operator} ${field}`,
      );
   }

   prepare(coord: Coordinates): string {
      // forcing numbers, so that nothing else than a number can be written in the sql
      const latitude = Number(coord.latitude);
      const longitude = Number(coord.longitude);
      return `( 6371 * acos( cos(radians(${latitude})) * cos(radians(${this.tableName}.latitude)) * cos( radians(${this.tableName}.longitude) - radians(${longitude}) ) + sin(radians(${latitude})) * sin(radians(${this.tableName}.latitude)) ) )`;
   }
}

function isFiniteNumber(o: unknown): boolean {
   return typeof o === 'number' && Number.isFinite(o);
}

export class ToDbSqlStringConverter extends ToDbSqlConverter<string> {
   constructor(
      typeConverter: (o: unknown) => string = (o: unknown) => {
         if (o === undefined || o === null) {
            throw new Error(`cannot convert [${o}] to string`);
         }
         return String(o);
      },
   ) {
      super(typeConverter);
   }

   prepare(v: string, deco?: string): string {
      if (deco === undefined) {
         return createSqlParam(v);
      }
      return `${createSqlParam(`${deco}${escapeLikeValue(v)}${deco}`)} ESCAPE '${likeEscapeChar}'`;
   }
}

export class ToDbSqlNumberConverter extends ToDbSqlConverter<number> {
   constructor(typeConverter: (o: unknown) => number = toNumber) {
      super(typeConverter);
   }

   prepare(v: number, deco?: string): string | number {
      if (typeof v !== 'number' || !Number.isFinite(v)) {
         throw new Error(`[${v}] is not a number`);
      }
      if (deco !== undefined) {
         return createSqlParam(`${deco}${v}${deco}`);
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
      super((o: unknown): number => {
         const r = typeof o === 'boolean' ? Number(o) : toNumber(o);
         if (r !== 0 && r !== 1) {
            throw new Error(`cannot convert [${o}] to boolean`);
         }
         return r;
      });
   }
}

function fromDateToMysqlDate(input: unknown): string {
   const d = getFunctionalDate(input);
   const date = [d.getFullYear(), format2digits(d.getMonth() + 1), format2digits(d.getDate())];
   return date.join('-');
}

function fromDatetimeToMysqlDatetime(input: unknown): string {
   const d = getFunctionalDate(input);

   const formattedDate = fromDateToMysqlDate(d);
   const time = [d.getHours(), d.getMinutes(), d.getSeconds()];
   return `${formattedDate} ${time.map((v) => format2digits(v)).join(':')}`;
}

function getFunctionalDate(input: unknown): Date {
   const d = new Date(input as string);
   if (input === undefined || input === null || isNaN(d.getTime())) {
      throw new Error(`cannot convert [${input}] to date`);
   }
   return d;
}

function format2digits(val: number): string {
   return String(val).padStart(2, '0');
}

function toNumber(o: unknown): number {
   const r = typeof o === 'string' && o.trim().length > 0 ? Number(o) : o;
   if (typeof r !== 'number' || !Number.isFinite(r)) {
      throw new Error(`cannot convert [${o}] to number`);
   }
   return r;
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
