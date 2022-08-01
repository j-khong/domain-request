import { isBoolean, isDate, isNumber, isString } from './type-checkers.ts';

export function validateId(val: any): { valid: boolean; reason: string } {
   const valid = isString(val);
   return { valid, reason: 'not a string' };
}

export function validateNumber(val: any): { valid: boolean; reason: string } {
   const valid = isNumber(val);
   return { valid, reason: 'not a number' };
}

export function validateNumberAndArray(val: any): { valid: boolean; reason: string } {
   return validateTypeAndArray(val, isNumber, 'number');
}

export function validateDateAndArray(val: any): { valid: boolean; reason: string } {
   return validateTypeAndArray(val, isDate, 'date');
}

export function validateISODateAndArray(o: any): {
   valid: boolean;
   reason: string;
} {
   return validateTypeAndArray(o, isIsoDate, 'date');
}

function validateTypeAndArray(
   o: any,
   typeValidator: (o: any) => boolean,
   typeName: string,
): {
   valid: boolean;
   reason: string;
} {
   let valid = false;
   if (Array.isArray(o)) {
      for (const v of o) {
         valid = typeValidator(v);
         if (!valid) {
            break;
         }
      }
   } else {
      valid = typeValidator(o);
   }

   return { valid, reason: `not a ${typeName}` };
}

function isIsoDate(o: any): boolean {
   try {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      const d = new Date(o);
      return true;
   } catch (e) {
      return false;
   }
}

export function validateString(val: any): { valid: boolean; reason: string } {
   const valid = isString(val);
   return { valid, reason: 'not a string' };
}

export function validateBoolean(val: any): { valid: boolean; reason: string } {
   const valid = isBoolean(val);
   return { valid, reason: 'not a boolean' };
}
