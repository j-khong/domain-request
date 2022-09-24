import { IsoDate } from './types.ts';
export type TypeChecker<Type> = (o: unknown) => o is Type;

export function isString(o: unknown): o is string {
   return typeof o === 'string';
}

export function isDate(o: unknown): o is Date {
   return isSomethingLike<Date>(o) && o.getTime !== undefined;
}

export function isIsoDate(o: unknown): o is IsoDate {
   if (isString(o)) {
      const d = new Date(o);
      if (isNaN(d.getTime())) {
         return false;
      }
      return true;
   }
   return false;
}

export function isNumber(o: unknown): o is number {
   return typeof o === 'number';
}

export function isBoolean(o: unknown): o is boolean {
   return typeof o === 'boolean';
}

export function isSomethingLike<T>(given: unknown): given is Partial<Record<keyof T, unknown>> {
   return typeof given === 'object' && given !== null;
}
