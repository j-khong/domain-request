export function isString(obj: any): obj is string {
   return typeof obj === 'string';
}

export function isDate(obj: any): obj is Date {
   return typeof obj === 'object' && obj.getTime !== undefined;
}

export function isNumber(obj: any): obj is number {
   return typeof obj === 'number';
}

export function isBoolean(obj: any): obj is boolean {
   return typeof obj === 'boolean';
}
