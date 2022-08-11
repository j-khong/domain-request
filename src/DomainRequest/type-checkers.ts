export type TypeChecker<Type> = (o: unknown) => o is Type;

export function isString(o: unknown): o is string {
   return typeof o === 'string';
}

export function isDate(o: unknown): o is Date {
   return typeof o === 'object' && (o as any).getTime !== undefined;
}

export function isIsoDate(o: unknown): o is string {
   const d = new Date(o as any);
   if (isNaN(d.getTime())) {
      return false;
   }
   return true;
}

export function isNumber(o: unknown): o is number {
   return typeof o === 'number';
}

export function isBoolean(o: unknown): o is boolean {
   return typeof o === 'boolean';
}
