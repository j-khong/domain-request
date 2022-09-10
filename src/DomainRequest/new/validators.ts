import { isNumber, isString, isBoolean, isDate, isIsoDate, TypeChecker } from '../type-checkers.ts';
import { Operator } from '../types.ts';
import { FieldFilteringConfig } from './field-configuration/index.ts';

// export type FiltersValidators<Fields> = {
//    [Property in keyof Fields]: {
//       validate: Validator;
//       defaultValue: Fields[Property];
//       authorizedValues?: Array<Fields[Property]>;
//       acceptedOperators: Operator[];
//    };
// };

// function buildFilterValidator<Fields>(
//    fieldMapping: FieldFilteringConfig<Fields>,
//    options?: {
//       customValidatorCreator?: FilterValidatorCreator<Fields>;
//       authorizedFields?: Array<keyof Fields>;
//    },
// ): FiltersValidators<Fields> {
//    const res: FiltersValidators<Fields> = {} as FiltersValidators<Fields>;

//    const commonValidatorCreator = buildCommonValidatorCreator();
//    let validatorCreator = commonValidatorCreator;
//    if (options?.customValidatorCreator !== undefined) {
//       // we evaluate the custom first as a custom type can be a subset of a primlitive type
//       // eg. type Status = 'opened' | 'close'
//       // if we evaluate status as a string first, then the validation function for a status will be the validation of a string
//       // then a value different from a status will be validated, provided it is a string
//       options.customValidatorCreator.setNext(commonValidatorCreator);
//       validatorCreator = options.customValidatorCreator;
//    }

//    for (const fn in fieldMapping) {
//       const fieldName = fn as keyof Fields;
//       if (options?.authorizedFields !== undefined) {
//          if (!options.authorizedFields.includes(fieldName)) {
//             continue;
//          }
//       }
//       const mapping = fieldMapping[fieldName];

//       const validator = validatorCreator.create(mapping);
//       if (validator === undefined) {
//          throw new Error(
//             `no validation function for custom type of field [${fn}] with default value [${mapping.values.default}]`,
//          );
//       }
//       let authorizedValues: Array<Fields[keyof Fields]> | undefined;
//       if (mapping.values.authorized !== undefined && mapping.values.authorized.length > 0) {
//          authorizedValues = mapping.values.authorized.map((v) => v);
//       }

//       res[fieldName] = {
//          validate: validator.validator,
//          defaultValue: mapping.values.default,
//          authorizedValues,
//          acceptedOperators: validator.acceptedOperators,
//       };
//    }

//    return res;
// }

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

function buildCommonValidatorCreator(): FilterValidatorCreator {
   const v1 = new DateFilterValidatorCreator();
   const v2 = new NumberFilterValidatorCreator();
   const v3 = new BooleanFilterValidatorCreator();
   const v4 = new IsoDateFilterValidatorCreator();
   const v5 = new StringFilterValidatorCreator();

   v1.setNext(v2);
   v2.setNext(v3);
   v3.setNext(v4);
   v4.setNext(v5);
   return v1;
}

type Validator = (val: unknown) => { valid: boolean; reason: string };
export interface FilterValidator {
   validator: Validator;
   acceptedOperators: Operator[];
}
// <-- chain of responsibility pattern
abstract class FilterValidatorCreator<T = unknown> {
   abstract setNext(fv: FilterValidatorCreator<unknown>): void;
   abstract create(conf: FieldFilteringConfig<unknown>): FilterValidator | undefined;
}

abstract class ConcreteFilterValidatorCreator<T> extends FilterValidatorCreator<T> {
   private logActivated = false;
   private next: FilterValidatorCreator<unknown> | undefined;

   constructor(private readonly isTypeToManage: TypeChecker<T>, private readonly typeName: string) {
      super();
   }

   setNext(fv: FilterValidatorCreator<unknown>): void {
      this.next = fv;
   }

   create(conf: FieldFilteringConfig<T>): FilterValidator | undefined {
      if (this.isTypeToManage(conf.values.default)) {
         return this.doCreate(conf);
      } else {
         if (this.next !== undefined) {
            return this.next.create(conf);
         }
      }
   }

   protected doCreate(conf: FieldFilteringConfig<T>): FilterValidator | undefined {
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

      const filter = conf.filtering;
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
         this.log(`validating ${this.typeName} of value [${val}]`);
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

   protected activateLog(): void {
      this.logActivated = true;
   }
   private log(s: string): void {
      if (this.logActivated) {
         console.log(s);
      }
   }
}

class StringFilterValidatorCreator extends ConcreteFilterValidatorCreator<string> {
   constructor() {
      super(isString, 'string');
   }
}
class NumberFilterValidatorCreator extends ConcreteFilterValidatorCreator<number> {
   constructor() {
      super(isNumber, 'number');
   }
}
class BooleanFilterValidatorCreator extends ConcreteFilterValidatorCreator<boolean> {
   constructor() {
      super(isBoolean, 'boolean');
   }

   protected doCreate(_conf: FieldFilteringConfig<boolean>): FilterValidator | undefined {
      return {
         validator: this.generateTypeValidator(),
         acceptedOperators: ['equals'],
      };
      // not applicable
      // if (conf.filtering.byListOfValue) {
      // }
   }
}
class DateFilterValidatorCreator extends ConcreteFilterValidatorCreator<Date> {
   constructor() {
      super(isDate, 'Date');
      // this.activateLog();
   }
}

class IsoDateFilterValidatorCreator extends ConcreteFilterValidatorCreator<string> {
   constructor() {
      super(isIsoDate, 'Iso Date string');
   }
}
// end of chain of responsibility pattern -->

// function validateISODateAndArray(o: unknown): {
//    valid: boolean;
//    reason: string;
// } {
//    return validateTypeOrArray(o, isIsoDate, 'date');
// }

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
