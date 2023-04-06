import { isString, isNumber, isSomethingLike } from '../type-checkers.ts';
import { getOperators, Operator, BoolTree, InputErrors } from '../types.ts';
import { ValidatorCreator, FilterValidator } from '../validators.ts';
import { FiltersTree, Comparison, ComputedComparison } from './types.ts';
import { FieldConfiguration } from './field.ts';

type InputFieldFilteringConfig<T, D> = {
   filtering?: {
      byRangeOfValue?: boolean;
      byListOfValue?: boolean;
   };
   values: {
      default: T;
      authorized?: Array<T>;
      typeValidator: (o: unknown) => o is T;
      typeName: string;
      dataValidator: (o: unknown) => o is D;
      dataName: string;
   };
};

export class ComputedFieldConfiguration<
   Value extends string | number | boolean | Date,
   Data,
> extends FieldConfiguration<Value> {
   private readonly fv2: FilterValidator;
   private readonly dv: FilterValidator;

   constructor(inconf: InputFieldFilteringConfig<Value, Data>) {
      super(inconf);
      const vc = new ValidatorCreator<Value>(inconf.values.typeValidator, inconf.values.typeName);
      this.fv2 = vc.create(inconf.filtering);
      const dvc = new ValidatorCreator<Data>(inconf.values.dataValidator, inconf.values.dataName);
      this.dv = dvc.create(inconf.filtering);
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
      const ret: {
         errors: InputErrors;
      } = { errors: [] };

      const inputFieldName = this.camelToInputStyle(fieldName);
      const val = inputFieldsToSelect[inputFieldName];
      if (val === undefined) {
         return undefined;
      }

      const validation = this.dv.validator(val);
      if (!validation.valid) {
         const inputFieldName = this.camelToInputStyle(fieldName);
         ret.errors.push({ context: 'selected field', fieldName: inputFieldName, reason: validation.reason });
      } else {
         toSet[fieldName] = val;
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
      const inputFieldName = this.camelToInputStyle(fieldName);
      const val = inputFilters[inputFieldName];
      if (val === undefined) {
         //  this.applyDefaultRestricted(fieldName, toSet);
         return undefined;
      }

      const res = this.processFilter2(fieldName, val);
      if (isString(res)) {
         ret.errors.push({
            context: 'filtering field',
            fieldName: inputFieldName,
            reason: res,
         });
         //  this.applyDefaultRestricted(fieldName, toSet);
         return ret;
      }

      const toAdd: { [Property in keyof Value]?: Comparison<Value> } = {};
      toAdd[fieldName as Extract<keyof Value, string>] = res;
      toSet[arrayToPush].push(toAdd);

      return undefined;
   }

   //    private applyDefaultRestricted(fieldName: string, toSet: FiltersTree<unknown>): void {
   //       // for each field with restrictions in "and" and "or", check if it has values
   //       /// if not, add default in "or"

   //       if (this.conf.values.authorized === undefined) {
   //          // no restrictions
   //          return undefined;
   //       }

   //       // this field has restrictions => check if it is present in filters
   //       if ((toSet as FiltersTree<T>).and.find((v) => v[fieldName as Extract<keyof T, string>] !== undefined)) {
   //          // this field has validated values, so next
   //          return undefined;
   //       }
   //       if ((toSet as FiltersTree<T>).or.find((v) => v[fieldName as Extract<keyof T, string>] !== undefined)) {
   //          // this field has validated values, so next
   //          return undefined;
   //       }

   //       // default values to add
   //       const allAuthorisedValues = this.conf.values.authorized.map(
   //          (
   //             value,
   //          ): {
   //             [Property in keyof T]: {
   //                operator: Operator;
   //                value: T;
   //             };
   //          } => {
   //             return {
   //                [fieldName]: {
   //                   operator: 'equals',
   //                   value,
   //                },
   //             } as {
   //                [Property in keyof T]: {
   //                   operator: Operator;
   //                   value: T;
   //                };
   //             };
   //          },
   //       );
   //       toSet.or.push(...allAuthorisedValues);
   //    }

   private processFilter2(field: string, comparison: unknown): string | ComputedComparison<Value> {
      if (!isSomethingLike<ComputedComparison<Value>>(comparison)) {
         return 'comparison object is not correct';
      }

      const inputFieldName = this.camelToInputStyle(field);
      if (comparison.operator === undefined) {
         return `missing comparison operator for key [${inputFieldName}]`;
      }

      if (comparison.value === undefined) {
         return `missing comparison value for key [${inputFieldName}]`;
      }

      if (comparison.data === undefined) {
         return `missing comparison data for key [${inputFieldName}]`;
      }

      if (!isString(comparison.operator)) {
         return 'invalid comparison operator : not a string';
      }

      const operator: Operator = this.inputStyleToCamel(comparison.operator);
      if (!getOperators().includes(operator)) {
         return `invalid comparison operator [${comparison.operator as string}] for key [${inputFieldName}]`;
      }

      //   if (!this.isAccepted(operator)) {
      //      return `you cannot use comparison operator [${operator}] with key [${inputFieldName}]`;
      //   }

      //   const restriction = this.checkRestriction(comparison.value);
      //   if (restriction !== undefined) {
      //      return restriction;
      //   }

      let validation = this.fv2.validator(comparison.value);
      if (!validation.valid) {
         return `invalid comparison value [${comparison.value as string}] for key [${inputFieldName}]: ${
            validation.reason
         }`;
      }

      validation = this.dv.validator(comparison.data);
      if (!validation.valid) {
         return `invalid comparison data [${JSON.stringify(comparison.data, null, 2)}] for key [${inputFieldName}]: ${
            validation.reason
         }`;
      }

      return {
         operator,
         value: comparison.value as ComputedComparison<Value>['value'],
         data: comparison.data,
      };
   }

   //    private isAccepted(op: Operator): boolean {
   //       return this.fv.acceptedOperators.includes(op);
   //    }

   //    private checkRestriction(value: unknown): string | undefined {
   //       // has restrictions
   //       if (this.conf.values.authorized !== undefined) {
   //          const notAuthorised = (o: unknown, authorized: T[]): boolean =>
   //             !(this.typeValidator(o) && authorized.includes(o));

   //          if (Array.isArray(value)) {
   //             for (const v of value) {
   //                if (notAuthorised(v, this.conf.values.authorized)) {
   //                   return `value [${v as string}] is not authorized`;
   //                }
   //             }
   //          } else {
   //             if (notAuthorised(value, this.conf.values.authorized)) {
   //                return `value [${value as string}] is not authorized`;
   //             }
   //          }
   //       }
   //       return undefined;
   //    }

   //    public addAuthorized(v: T[]): void {
   //       if (this.conf.values.authorized === undefined) {
   //          this.conf.values.authorized = [];
   //       }
   //       this.conf.values.authorized.push(...v);
   //    }
}

export interface Coordinates {
   latitude: string;
   longitude: string;
}

export class DistanceFieldConfiguration extends ComputedFieldConfiguration<number, Coordinates> {
   constructor() {
      super({
         values: {
            default: 0,
            typeValidator: isDistance,
            typeName: 'Distance',
            dataValidator: isCoordinates,
            dataName: 'Coordinates',
         },
      });
   }
}
function isDistance(o: unknown): o is number {
   return isNumber(o);
}
function isCoordinates(o: unknown): o is Coordinates {
   return isSomethingLike<Coordinates>(o) && isNumber(o.latitude) && isNumber(o.longitude);
}
