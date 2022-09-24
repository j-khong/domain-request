import { isString, isNumber, isDate, isIsoDate, isBoolean, isSomethingLike } from '../type-checkers.ts';
import { getOperators, Operator, BoolTree, InputErrors, IsoDate } from '../types.ts';

import { FieldFilteringConfig, DomainFieldConfiguration, Comparison } from './index.ts';
import { ValidatorCreator, FilterValidator } from '../validators.ts';
import { FiltersTree } from './types.ts';

type InputFieldFilteringConfig<T> = {
   filtering?: {
      byRangeOfValue?: boolean;
      byListOfValue?: boolean;
   };
   values: {
      default: T;
      authorized?: Array<T>;
      typeValidator: (o: unknown) => o is T;
      typeName: string;
   };
};

export class FieldConfiguration<T extends string | number | boolean | Date> extends DomainFieldConfiguration {
   private readonly conf: FieldFilteringConfig<T>;
   private readonly typeValidator: (o: unknown) => o is T;
   private readonly typeName: string;
   private readonly fv: FilterValidator;

   // constructor(inconf: InputFieldFilteringConfig<T>) {
   constructor(inconf: InputFieldFilteringConfig<T>) {
      super();

      this.typeValidator = inconf.values.typeValidator;
      this.typeName = inconf.values.typeName;

      this.conf = inconf;
      const vc = new ValidatorCreator<T>(inconf.values.typeValidator, inconf.values.typeName);
      this.fv = vc.create(this.conf.filtering);
   }

   sanitizeField(
      inputFieldsToSelect: BoolTree,
      fieldName: string,
      toSet: BoolTree,
   ):
      | {
           errors: InputErrors;
        }
      | undefined {
      //   toSet[fieldName] = false;
      const ret: {
         errors: InputErrors;
      } = { errors: [] };

      const val = inputFieldsToSelect[this.camelToInputStyle(fieldName)];
      if (val === undefined) {
         return undefined;
      }

      if (typeof val === 'boolean') {
         if (val === true /* || val === 1*/) {
            toSet[fieldName] = true;
         }
      } else {
         ret.errors.push({ context: 'selected field', fieldName, reason: 'not a boolean' });
      }
      return ret;
   }

   sanitizeFilter(
      inputFilters: { [key: string]: unknown },
      fieldName: string, //Extract<keyof T, string>,
      toSet: FiltersTree<unknown>,
      arrayToPush: 'and' | 'or',
   ):
      | {
           errors: InputErrors;
        }
      | undefined {
      const ret: {
         errors: InputErrors;
      } = { errors: [] };

      const val = inputFilters[this.camelToInputStyle(fieldName)];
      if (val === undefined) {
         this.applyDefaultRestricted(fieldName, toSet);
         return undefined;
      }

      const res = this.processFilter(fieldName, val);
      if (isString(res)) {
         ret.errors.push({
            context: 'filtering field',
            fieldName,
            reason: res,
         });
         this.applyDefaultRestricted(fieldName, toSet);
         return ret;
      }

      const toAdd: { [Property in keyof T]?: Comparison<T> } = {};
      toAdd[fieldName as Extract<keyof T, string>] = res;
      toSet[arrayToPush].push(toAdd);

      return undefined;
   }

   private applyDefaultRestricted(fieldName: string, toSet: FiltersTree<unknown>): void {
      // for each field with restrictions in "and" and "or", check if it has values
      /// if not, add default in "or"

      if (this.conf.values.authorized === undefined) {
         // no restrictions
         return undefined;
      }

      // this field has restrictions => check if it is present in filters
      if ((toSet as FiltersTree<T>).and.find((v) => v[fieldName as Extract<keyof T, string>] !== undefined)) {
         // this field has validated values, so next
         return undefined;
      }
      if ((toSet as FiltersTree<T>).or.find((v) => v[fieldName as Extract<keyof T, string>] !== undefined)) {
         // this field has validated values, so next
         return undefined;
      }

      // default values to add
      const allAuthorisedValues = this.conf.values.authorized.map(
         (
            value,
         ): {
            [Property in keyof T]: {
               operator: Operator;
               value: T;
            };
         } => {
            return {
               [fieldName]: {
                  operator: 'equals',
                  value,
               },
            } as {
               [Property in keyof T]: {
                  operator: Operator;
                  value: T;
               };
            };
         },
      );
      toSet.or.push(...allAuthorisedValues);
   }

   private processFilter(field: string, comparison: unknown): string | Comparison<T> {
      if (!isSomethingLike<Comparison<T>>(comparison)) {
         return 'comparison object is not correct';
      }

      const inputFieldName = this.camelToInputStyle(field);
      if (comparison.operator === undefined) {
         return `missing comparison operator for key [${inputFieldName}]`;
      }

      if (comparison.value === undefined) {
         return `missing comparison value for key [${inputFieldName}]`;
      }

      if (!isString(comparison.operator)) {
         return 'invalid comparison operator : not a string';
      }

      const operator: Operator = this.inputStyleToCamel(comparison.operator);
      if (!getOperators().includes(operator)) {
         return `invalid comparison operator [${comparison.operator as string}] for key [${inputFieldName}]`;
      }

      if (!this.isAccepted(operator)) {
         return `you cannot use comparison operator [${operator}] with key [${inputFieldName}]`;
      }

      const restriction = this.checkRestriction(comparison.value);
      if (restriction !== undefined) {
         return restriction;
      }

      const validation = this.validate(comparison.value);
      if (validation.valid) {
         return {
            operator,
            value: comparison.value as any,
         };
      }

      return `invalid comparison value [${comparison.value as string}] for key [${inputFieldName}]: ${
         validation.reason
      }`;
   }

   private isAccepted(op: Operator): boolean {
      return this.fv.acceptedOperators.includes(op);
   }

   private checkRestriction(value: unknown): string | undefined {
      // has restrictions
      if (this.conf.values.authorized !== undefined) {
         const notAuthorised = (o: unknown, authorized: T[]): boolean =>
            !(this.typeValidator(o) && authorized.includes(o));

         if (Array.isArray(value)) {
            for (const v of value) {
               if (notAuthorised(v, this.conf.values.authorized)) {
                  return `value [${v as string}] is not authorized`;
               }
            }
         } else {
            if (notAuthorised(value, this.conf.values.authorized)) {
               return `value [${value as string}] is not authorized`;
            }
         }
      }
      return undefined;
   }

   private validate(o: unknown): { valid: boolean; reason: string } {
      return this.fv.validator(o);
   }

   public addAuthorized(v: T[]): void {
      if (this.conf.values.authorized === undefined) {
         this.conf.values.authorized = [];
      }
      this.conf.values.authorized.push(...v);
   }
}

type InputSpecializedFieldFilteringConfig<T> = {
   filtering?: {
      byRangeOfValue?: boolean;
      byListOfValue?: boolean;
   };
   values?: {
      authorized?: Array<T>;
   };
};

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
