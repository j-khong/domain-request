import { isBoolean, isDate, isNumber, isString } from './type-checkers.ts';

export function validateId(val: any): { valid: boolean; reason: string } {
   const valid = isString(val);
   return { valid, reason: 'not a string' };
}

export function validateNumber(val: any): { valid: boolean; reason: string } {
   const valid = isNumber(val);
   return { valid, reason: 'not a number' };
}

export function validateDate(val: any): { valid: boolean; reason: string } {
   let valid = false;
   if (Array.isArray(val)) {
      for (const v of val) {
         valid = isDate(v);
         if (!valid) {
            break;
         }
      }
   } else {
      valid = isDate(val);
   }
   return { valid, reason: 'not a date' };
}

export function validateISODate(o: any): {
   valid: boolean;
   reason: string;
} {
   let valid = false;
   if (Array.isArray(o)) {
      for (const v of o) {
         valid = isIsoDate(v);
         if (!valid) {
            break;
         }
      }
   } else {
      valid = isIsoDate(o);
   }

   return { valid, reason: 'not a date' };
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
