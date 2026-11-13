import { FieldConfiguration } from '../field-configuration/field.ts';
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

type SpecializedConfig<T> = {
   filtering?: FieldFilteringConfig<T>['filtering'];
   values?: {
      authorized?: Array<T>;
   };
};

export class FieldConfigFactory {
   /**
    * Create a string field configuration
    */
   static createString(config?: SpecializedConfig<string>): FieldConfiguration<string> {
      return new FieldConfiguration<string>({
         filtering: config?.filtering,
         values: {
            default: '',
            authorized: config?.values?.authorized,
            typeValidator: isString,
            typeName: 'string',
         },
      });
   }

   /**
    * Create a number field configuration
    */
   static createNumber(config?: SpecializedConfig<number>): FieldConfiguration<number> {
      return new FieldConfiguration<number>({
         filtering: config?.filtering,
         values: {
            default: 0,
            authorized: config?.values?.authorized,
            typeValidator: isNumber,
            typeName: 'number',
         },
      });
   }

   /**
    * Create a boolean field configuration
    */
   static createBoolean(config?: SpecializedConfig<boolean>): FieldConfiguration<boolean> {
      return new FieldConfiguration<boolean>({
         filtering: config?.filtering,
         values: {
            default: false,
            authorized: config?.values?.authorized,
            typeValidator: isBoolean,
            typeName: 'boolean',
         },
      });
   }

   /**
    * Create a date field configuration
    */
   static createDate(config?: SpecializedConfig<Date>): FieldConfiguration<Date> {
      return new FieldConfiguration<Date>({
         filtering: config?.filtering,
         values: {
            default: new Date(),
            authorized: config?.values?.authorized,
            typeValidator: isDate,
            typeName: 'date',
         },
      });
   }

   /**
    * Create an ISO date (string) field configuration
    */
   static createIsoDate(config?: SpecializedConfig<string>): FieldConfiguration<string> {
      return new FieldConfiguration<string>({
         filtering: config?.filtering,
         values: {
            default: new Date().toISOString(),
            authorized: config?.values?.authorized,
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
   static createGeneric<T extends string | number | boolean | Date>(
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
