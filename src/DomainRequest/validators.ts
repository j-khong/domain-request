import { isBoolean, isDate, isNumber, isString, isIsoDate, TypeChecker } from './type-checkers.ts';

export function buildFilterValidator<Fields>(
   fieldMapping: FilteringConfig<Fields>,
   options?: {
      customValidatorCreator?: FilterValidatorCreator<Fields>;
      authorizedFields?: Array<keyof Fields>;
   },
): FiltersValidators<Fields> {
   const res: FiltersValidators<Fields> = {} as FiltersValidators<Fields>;

   const commonValidatorCreator = buildCommonValidatorCreator<Fields>();
   let validatorCreator = commonValidatorCreator;
   if (options?.customValidatorCreator !== undefined) {
      // we evaluate the custom first as a custom type can be a subset of a primlitive type
      // eg. type Status = 'opened' | 'close'
      // if we evaluate status as a string first, then the validation function for a status will be the validation of a string
      // then a value different from a status will be validated, provided it is a string
      options.customValidatorCreator.setNext(commonValidatorCreator);
      validatorCreator = options.customValidatorCreator;
   }

   for (const fn in fieldMapping) {
      const fieldName = fn as keyof Fields;
      if (options?.authorizedFields !== undefined && options?.authorizedFields.length > 0) {
         if (!options.authorizedFields.includes(fieldName)) {
            continue;
         }
      }
      const mapping = fieldMapping[fieldName];
      const validator = validatorCreator.create(mapping);
      if (validator === undefined) {
         throw new Error(
            `no validation function for custom type of field [${fn}] with default value [${mapping.values.default}]`,
         );
      }
      let authorizedValues: Array<Fields[keyof Fields]> | undefined;
      if (mapping.values.authorized !== undefined && mapping.values.authorized.length > 0) {
         authorizedValues = mapping.values.authorized.map((v) => v);
      }

      res[fieldName] = {
         validate: validator,
         defaultValue: mapping.values.default,
         authorizedValues,
      };
   }

   return res;
}

function buildCommonValidatorCreator<Fields>(): FilterValidatorCreator<Fields> {
   const v1 = new DateFilterValidatorCreator<Fields>();
   const v2 = new NumberFilterValidatorCreator<Fields>();
   const v3 = new BooleanFilterValidatorCreator<Fields>();
   const v4 = new IsoDateFilterValidatorCreator<Fields>();
   const v5 = new StringFilterValidatorCreator<Fields>();

   v1.setNext(v2);
   v2.setNext(v3);
   v3.setNext(v4);
   v4.setNext(v5);
   return v1;
}

// export type FilterValidator<Fields, Property extends keyof Fields> = {
//    validate: Validator;
//    defaultValue: Fields[Property];
//    authorizedValues?: Fields[Property][];
// };
export type FiltersValidators<Fields> = {
   [Property in keyof Fields]: {
      validate: Validator;
      defaultValue: Fields[Property];
      authorizedValues?: Array<Fields[Property]>;
   };
};

export type Validator = (val: unknown) => { valid: boolean; reason: string };

export type FilteringConfig<Fields> = {
   [Property in keyof Fields]: FilteringConf<Fields, Property>;
};
type FilteringConf<Fields, Property extends keyof Fields> = {
   filtering: {
      byRangeOfValue: boolean;
      byListOfValue: boolean;
   };
   values: {
      default: Fields[Property];
      authorized?: Array<Fields[Property]>;
   };
};

// <-- chain of responsibility pattern
export interface FilterValidatorCreator<Fields> {
   setNext: (fv: FilterValidatorCreator<Fields>) => void;
   create: (conf: FilteringConf<Fields, keyof Fields>) => Validator | undefined;
}

export abstract class ConcreteFilterValidatorCreator<Fields, TypeToValidate> implements FilterValidatorCreator<Fields> {
   private logActivated = false;
   private next: FilterValidatorCreator<Fields> | undefined;

   constructor(private readonly isTypeToManage: TypeChecker<TypeToValidate>, private readonly typeName: string) {}

   setNext(fv: FilterValidatorCreator<Fields>): void {
      this.next = fv;
   }

   create(conf: FilteringConf<Fields, keyof Fields>): Validator | undefined {
      if (this.isTypeToManage(conf.values.default)) {
         return this.doCreate(conf);
      } else {
         if (this.next !== undefined) {
            return this.next.create(conf);
         }
      }
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

   protected generateTypeORangeValidator(): Validator {
      const type = this.typeName;
      const typeChecker = this.isTypeToManage;

      return (val: unknown): { valid: boolean; reason: string } => {
         return validateTypeOrRange(val, typeChecker, type);
      };
   }

   protected doCreate(conf: FilteringConf<Fields, keyof Fields>): Validator | undefined {
      let validator: Validator = this.generateTypeValidator();
      if (conf.filtering.byListOfValue) {
         validator = this.generateTypeOrArrayValidator();
      } else if (conf.filtering.byRangeOfValue) {
         validator = this.generateTypeORangeValidator();
      }
      return validator;
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

class StringFilterValidatorCreator<Fields> extends ConcreteFilterValidatorCreator<Fields, string> {
   constructor() {
      super(isString, 'string');
   }
}
class NumberFilterValidatorCreator<Fields> extends ConcreteFilterValidatorCreator<Fields, number> {
   constructor() {
      super(isNumber, 'number');
   }
}
class BooleanFilterValidatorCreator<Fields> extends ConcreteFilterValidatorCreator<Fields, boolean> {
   constructor() {
      super(isBoolean, 'boolean');
   }

   protected doCreate(_conf: FilteringConf<Fields, keyof Fields>): Validator | undefined {
      return this.generateTypeValidator();
      // not applicable
      // if (conf.filtering.byListOfValue) {
      // }
   }
}
class DateFilterValidatorCreator<Fields> extends ConcreteFilterValidatorCreator<Fields, Date> {
   constructor() {
      super(isDate, 'Date');
      // this.activateLog();
   }
}

class IsoDateFilterValidatorCreator<Fields> extends ConcreteFilterValidatorCreator<Fields, string> {
   constructor() {
      super(isIsoDate, 'Iso Date string');
   }
}
// end of chain of responsibility pattern -->

export function validateISODateAndArray(o: unknown): {
   valid: boolean;
   reason: string;
} {
   return validateTypeOrArray(o, isIsoDate, 'date');
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
      }
      for (let count = 0; count < 2; count++) {
         valid = typeValidator(o[count]);
         if (!valid) {
            reason = `not a range of ${typeName}, value [${count + 1}] is not a date`;
            break;
         }
      }
   } else {
      valid = typeValidator(o);
   }

   return { valid, reason };
}

export function validateString(val: unknown): { valid: boolean; reason: string } {
   const valid = isString(val);
   return { valid, reason: 'not a string' };
}

export function validateBoolean(val: unknown): { valid: boolean; reason: string } {
   const valid = isBoolean(val);
   return { valid, reason: 'not a boolean' };
}
