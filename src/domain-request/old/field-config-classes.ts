/**
 * DEPRECATED: Old Field Configuration Classes
 *
 * These 6 classes are now replaced by FieldConfigFactory for better maintainability
 * and to reduce boilerplate code (96 lines → 0 lines).
 *
 * @deprecated Use FieldConfigFactory instead (see ../field-configuration/FieldConfigFactory.ts)
 *
 * MIGRATION:
 * Before:
 *   new StringFieldConfiguration({ filtering: { byListOfValue: true } })
 *
 * After:
 *   FieldConfigFactory.createString({ filtering: { byListOfValue: true } })
 */

import { FieldConfiguration } from '../field-configuration/field.ts';
import { isString, isNumber, isDate, isIsoDate, isBoolean } from '../type-checkers.ts';
import { IsoDate } from '../types.ts';

type InputSpecializedFieldFilteringConfig<T> = {
   filtering?: {
      byRangeOfValue?: boolean;
      byListOfValue?: boolean;
   };
   values?: {
      authorized?: Array<T>;
   };
};

/**
 * @deprecated Use FieldConfigFactory.createString()
 */
export class StringFieldConfiguration extends FieldConfiguration<string> {
   constructor(inconf: InputSpecializedFieldFilteringConfig<string>) {
      super({
         filtering: inconf.filtering,
         values: {
            default: '',
            authorized: inconf.values?.authorized,
            typeValidator: isString,
            typeName: 'string',
         },
      });
   }
}

/**
 * @deprecated Use FieldConfigFactory.createNumber()
 */
export class NumberFieldConfiguration extends FieldConfiguration<number> {
   constructor(inconf: InputSpecializedFieldFilteringConfig<number>) {
      super({
         filtering: inconf.filtering,
         values: {
            default: 0,
            authorized: inconf.values?.authorized,
            typeValidator: isNumber,
            typeName: 'number',
         },
      });
   }
}

/**
 * @deprecated Use FieldConfigFactory.createDate()
 */
export class DateFieldConfiguration extends FieldConfiguration<Date> {
   constructor(inconf: InputSpecializedFieldFilteringConfig<Date>) {
      super({
         filtering: inconf.filtering,
         values: {
            default: new Date(),
            authorized: inconf.values?.authorized,
            typeValidator: isDate,
            typeName: 'Date',
         },
      });
   }
}

/**
 * @deprecated Use FieldConfigFactory.createIsoDate()
 */
export class IsoDateFieldConfiguration extends FieldConfiguration<IsoDate> {
   constructor(inconf: InputSpecializedFieldFilteringConfig<IsoDate>) {
      super({
         filtering: inconf.filtering,
         values: {
            default: '',
            authorized: inconf.values?.authorized,
            typeValidator: isIsoDate,
            typeName: 'Iso Date string',
         },
      });
   }
}

/**
 * @deprecated Use FieldConfigFactory.createBoolean()
 */
export class BooleanFieldConfiguration extends FieldConfiguration<boolean> {
   constructor() {
      super({
         values: {
            default: false,
            typeValidator: isBoolean,
            typeName: 'boolean',
         },
      });
   }
}
