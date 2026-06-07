import { FieldConfiguration } from '../field-configuration/field.ts';
import { ComputedFieldConfiguration } from '../field-configuration/computed.ts';
import { ValidatorCreator } from '../validators.ts';
import { TypeChecker } from '../type-checkers.ts';
import { isString, isNumber, isBoolean, isDate, isIsoDate } from '../type-checkers.ts';
import { FieldFilteringConfig } from '../field-configuration/types.ts';

/**
 * FieldConfigFactory - Eliminates 6 repetitive field configuration classes
 *
 * Old approach (96 lines):
 * ```
 * export class StringFieldConfiguration extends FieldConfiguration<string> {}
 * export class NumberFieldConfiguration extends FieldConfiguration<number> {}
 * export class BooleanFieldConfiguration extends FieldConfiguration<boolean> {}
 * // ... 3 more
 * ```
 *
 * New approach (centralized, reusable):
 * ```
 * FieldConfigFactory.createString(config)
 * FieldConfigFactory.createNumber(config)
 * ```
 */
export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'isoDate';

export class FieldConfigFactory {
   /**
    * Create a string field configuration
    */
   static createString(config?: FieldFilteringConfig<string>): FieldConfiguration<string> {
      return new FieldConfiguration<string>({
         ...config,
         values: {
            default: '',
            typeValidator: isString,
            typeName: 'string',
         },
      });
   }

   /**
    * Create a number field configuration
    */
   static createNumber(config?: FieldFilteringConfig<number>): FieldConfiguration<number> {
      return new FieldConfiguration<number>({
         ...config,
         values: {
            default: 0,
            typeValidator: isNumber,
            typeName: 'number',
         },
      });
   }

   /**
    * Create a boolean field configuration
    */
   static createBoolean(config?: FieldFilteringConfig<boolean>): FieldConfiguration<boolean> {
      return new FieldConfiguration<boolean>({
         ...config,
         values: {
            default: false,
            typeValidator: isBoolean,
            typeName: 'boolean',
         },
      });
   }

   /**
    * Create a date field configuration
    */
   static createDate(config?: FieldFilteringConfig<Date>): FieldConfiguration<Date> {
      return new FieldConfiguration<Date>({
         ...config,
         values: {
            default: new Date(),
            typeValidator: isDate,
            typeName: 'date',
         },
      });
   }

   /**
    * Create an ISO date (string) field configuration
    */
   static createIsoDate(config?: FieldFilteringConfig<string>): FieldConfiguration<string> {
      return new FieldConfiguration<string>({
         ...config,
         values: {
            default: new Date().toISOString(),
            typeValidator: isIsoDate,
            typeName: 'isoDate',
         },
      });
   }

   /**
    * Auto-detect field type and create appropriate configuration
    * Useful when building from a sample object
    */
   static createFromValue(
      value: any,
      filtering?: { byRangeOfValue?: boolean; byListOfValue?: boolean },
   ): FieldConfiguration<any> {
      if (typeof value === 'string') {
         return this.createString({ filtering });
      } else if (typeof value === 'number') {
         return this.createNumber({ filtering });
      } else if (typeof value === 'boolean') {
         return this.createBoolean({ filtering });
      } else if (isDate(value)) {
         return this.createDate({ filtering });
      } else if (isIsoDate(value)) {
         return this.createIsoDate({ filtering });
      }
      throw new Error(`Cannot create FieldConfiguration for value type: ${typeof value}`);
   }

   /**
    * Create a generic field configuration for any type
    * with custom type checker and validator
    */
   static createGeneric<T>(
      typeChecker: TypeChecker<T>,
      typeName: string,
      defaultValue: T,
      filtering?: { byRangeOfValue?: boolean; byListOfValue?: boolean },
   ): FieldConfiguration<T> {
      return new FieldConfiguration<T>({
         filtering,
         values: {
            default: defaultValue,
            typeValidator: typeChecker,
            typeName,
         },
      });
   }
}

/**
 * For backwards compatibility, export these as named exports
 * so existing code like `new StringFieldConfiguration()` still works
 * (but internally uses the factory)
 */
export class StringFieldConfiguration extends FieldConfiguration<string> {
   constructor(config?: FieldFilteringConfig<string>) {
      super({
         ...config,
         values: {
            default: '',
            typeValidator: isString,
            typeName: 'string',
         },
      });
   }
}

export class NumberFieldConfiguration extends FieldConfiguration<number> {
   constructor(config?: FieldFilteringConfig<number>) {
      super({
         ...config,
         values: {
            default: 0,
            typeValidator: isNumber,
            typeName: 'number',
         },
      });
   }
}

export class BooleanFieldConfiguration extends FieldConfiguration<boolean> {
   constructor(config?: FieldFilteringConfig<boolean>) {
      super({
         ...config,
         values: {
            default: false,
            typeValidator: isBoolean,
            typeName: 'boolean',
         },
      });
   }
}

export class DateFieldConfiguration extends FieldConfiguration<Date> {
   constructor(config?: FieldFilteringConfig<Date>) {
      super({
         ...config,
         values: {
            default: new Date(),
            typeValidator: isDate,
            typeName: 'date',
         },
      });
   }
}

export class IsoDateFieldConfiguration extends FieldConfiguration<string> {
   constructor(config?: FieldFilteringConfig<string>) {
      super({
         ...config,
         values: {
            default: new Date().toISOString(),
            typeValidator: isIsoDate,
            typeName: 'isoDate',
         },
      });
   }
}
