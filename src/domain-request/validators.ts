import { TypeChecker } from './type-checkers.ts';
import { Operator } from './types.ts';

export class ValidatorCreator<T> {
   constructor(private readonly isTypeToManage: TypeChecker<T>, private readonly typeName: string) {}

   create(filter?: { byRangeOfValue?: boolean; byListOfValue?: boolean }): FilterValidator {
      let validator: Validator = this.generateTypeValidator();
      const allTime: Operator[] = [
         'equals',
         'greaterThan',
         'greaterThanOrEquals',
         'lesserThan',
         'lesserThanOrEquals',
         'contains',
      ];
      const range: Operator[] = ['between'];
      const array: Operator[] = ['contains'];
      let acceptedOperators: Operator[] = [...allTime];

      if (filter !== undefined) {
         const isByList = filter.byListOfValue !== undefined && filter.byListOfValue;
         const isByRange = filter.byRangeOfValue !== undefined && filter.byRangeOfValue;
         if (isByList && isByRange) {
            validator = this.generateTypeOrArrayValidator();
            acceptedOperators = [...allTime, ...range, ...array];
         } else if (isByList) {
            validator = this.generateTypeOrArrayValidator();
            acceptedOperators = [...allTime, ...array];
         } else if (isByRange) {
            validator = this.generateTypeOrRangeValidator();
            acceptedOperators = [...allTime, ...range];
         }
      }
      return { validator, acceptedOperators };
   }

   protected generateTypeValidator(): Validator {
      const reason = `not a ${this.typeName}`;
      const typeChecker = this.isTypeToManage;
      return (val: unknown): { valid: boolean; reason: string } => {
         //    this.log(`validating ${this.typeName} of value [${val}]`);
         return { valid: typeChecker(val), reason };
      };
   }

   protected generateTypeOrArrayValidator(): Validator {
      const type = this.typeName;
      const typeChecker = this.isTypeToManage;

      return (val: unknown): { valid: boolean; reason: string } => {
         return validateTypeOrArray(val, typeChecker, type);
      };
   }

   protected generateTypeOrRangeValidator(): Validator {
      const type = this.typeName;
      const typeChecker = this.isTypeToManage;

      return (val: unknown): { valid: boolean; reason: string } => {
         return validateTypeOrRange(val, typeChecker, type);
      };
   }
}

type Validator = (val: unknown) => { valid: boolean; reason: string };
export interface FilterValidator {
   validator: Validator;
   acceptedOperators: Operator[];
}

function validateTypeOrArray(
   o: unknown,
   typeValidator: (o: unknown) => boolean,
   typeName: string,
): {
   valid: boolean;
   reason: string;
} {
   let valid = false;
   let reason = `not a ${typeName}`;
   if (Array.isArray(o)) {
      if (o.length < 2) {
         reason = `not a list of ${typeName}, a list needs at least 2 values`;
      } else {
         for (let count = 0; count < o.length; count++) {
            valid = typeValidator(o[count]);
            if (!valid) {
               reason = `not a list of ${typeName}, value [${count + 1}] is not a ${typeName}`;
               break;
            }
         }
      }
   } else {
      valid = typeValidator(o);
   }

   return { valid, reason };
}

function validateTypeOrRange(
   o: unknown,
   typeValidator: (o: unknown) => boolean,
   typeName: string,
): {
   valid: boolean;
   reason: string;
} {
   let valid = false;
   let reason = `not a ${typeName}`;
   if (Array.isArray(o)) {
      if (o.length !== 2) {
         reason = `not a range of ${typeName}, a range needs 2 values`;
      } else {
         for (let count = 0; count < o.length; count++) {
            valid = typeValidator(o[count]);
            if (!valid) {
               reason = `not a range of ${typeName}, value [${count + 1}] is not a ${typeName}`;
               break;
            }
         }
      }
   } else {
      valid = typeValidator(o);
   }

   return { valid, reason };
}
