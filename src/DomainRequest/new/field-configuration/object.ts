import { RequestableFields, BoolTree, Tree, InputErrors } from '../../types.ts';
import { isNumber } from '../../type-checkers.ts';
import { DomainFieldConfiguration, FiltersTree } from './index.ts';
import { FieldConfiguration } from './field.ts';
import { ArrayOfLinkedDomainConfiguration } from './linked.ts';

export type FieldsSetup<T> = {
   [Property in keyof T]: FilteringConfChoice<T, Property>;
};

type FilteringConfChoice<T, Property extends keyof T> = Unarray<T[Property]> extends string | number | boolean | Date
   ? FieldConfiguration<Unarray<T[Property]>>
   : ObjectFieldConfiguration<Unarray<T[Property]>> | ArrayOfLinkedDomainConfiguration<string, unknown>;

type Unarray<T> = T extends Array<infer U> ? U : T;

export class ObjectFieldConfiguration<Fields> extends DomainFieldConfiguration {
   getConf(): Readonly<FieldsSetup<Fields>> {
      return this.conf;
   }
   constructor(private readonly conf: FieldsSetup<Fields>) {
      super();
   }

   sanitizeFields(inputFieldsToSelect: BoolTree): {
      fields: RequestableFields<Fields>;
      errors: InputErrors;
   } {
      const errors: InputErrors = [];

      const ret = {};
      for (const key in this.conf) {
         const res = this.conf[key].sanitizeField(inputFieldsToSelect, key, ret);
         if (res !== undefined) {
            errors.push(...res.errors);
         }
      }

      const fields = ret as RequestableFields<Fields>;

      //
      // find unknown fields
      const res = this.findErrors('selected field', inputFieldsToSelect, '');
      if (res !== undefined) {
         errors.push(...res.errors);
      }

      return { fields, errors };
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
      const val = inputFieldsToSelect[this.camelToInputStyle(fieldName)];
      if (val === undefined) {
         return undefined;
      }

      const errors: InputErrors = [];

      toSet[fieldName] = {};
      for (const key in this.conf) {
         const res = this.conf[key].sanitizeField(val as BoolTree, key, toSet[fieldName] as BoolTree);
         if (res !== undefined) {
            errors.push(...res.errors);
         }
      }
      return {
         errors,
      };
   }

   findErrors(
      context: 'selected field' | 'filtering field' | 'option',
      inputFieldsToSelect: Tree,
      previous: string,
   ):
      | {
           errors: InputErrors;
        }
      | undefined {
      const ret: {
         errors: InputErrors;
      } = { errors: [] };

      for (const snakedFieldname in inputFieldsToSelect) {
         const cameledFieldName = this.inputStyleToCamel(snakedFieldname);
         const expectedSnake = this.camelToInputStyle(cameledFieldName);
         const val = this.conf[cameledFieldName as Extract<keyof Fields, string>];
         if (val === undefined) {
            if (context === 'filtering field' && (snakedFieldname === 'or' || snakedFieldname === 'and')) {
               continue;
            }
            ret.errors.push({
               context,
               fieldName: snakedFieldname,
               reason: `unknown field [${previous}${snakedFieldname}]`,
            });
         }
         // test not a snake
         else if (expectedSnake !== snakedFieldname) {
            ret.errors.push({
               context,
               fieldName: snakedFieldname,
               reason: `unknown field [${previous}${snakedFieldname}], did you mean [${previous}${expectedSnake}] ?`,
            });
         } else {
            const err = val.findErrors(
               context,
               inputFieldsToSelect[snakedFieldname] as Tree,
               `${previous}${snakedFieldname}.`,
            );
            if (err !== undefined) {
               ret.errors.push(...err.errors);
            }
         }
      }
      return ret;
   }

   sanitizeFilters(inputFilters: { [key: string]: unknown }): {
      // filters: FilteringFields<DomainFields<FieldNames>>; //FilteringFields<Fields>;
      filters: FiltersTree<Fields>;
      errors: InputErrors;
   } {
      const filters: FiltersTree<Fields> = { and: [], or: [] };
      const errors: InputErrors = [];

      // process fields in "and" and "or"
      for (const arrayType in inputFilters) {
         if (arrayType === 'or' || arrayType === 'and') {
            const arr = inputFilters[arrayType];
            if (!Array.isArray(arr)) {
               errors.push({
                  context: 'filtering field',
                  fieldName: arrayType,
                  reason: `${arrayType} must be an array`,
               });
               continue;
            }
            for (const obj of arr) {
               for (const key in this.conf) {
                  const res = this.conf[key].sanitizeFilter(obj, key, filters, arrayType);
                  if (res !== undefined) {
                     errors.push(...res.errors);
                  }
               }
            }
         }
      }

      for (const key in this.conf) {
         const res = this.conf[key].sanitizeFilter(inputFilters, key, filters, 'and');
         if (res !== undefined) {
            errors.push(...res.errors);
         }
      }
      // console.log('filters:', filters);

      // // for each field with restrictions in "and" and "or", check if it has values
      // /// if not, add default in "or"
      // for (const field of fieldsNames) {
      //    const fieldConf = this.validatorFilterMap.fields[field];
      //    if (!fieldConf.hasRestrictedValues()) {
      //       // no restrictions
      //       continue;
      //    }
      //    // this field has restrictions => check if it is present in filters
      //    if (filters[field] !== undefined) {
      //       // this field has validated values, so next
      //       continue;
      //    }

      //    // this field has restrictions and is not used for filtering
      //    // => default values to add
      //    const allAuthorisedValues = fieldConf.getAuthorizedValues().map(
      //       (
      //          value,
      //       ): {
      //          operator: Operator;
      //          value: any;
      //       } => {
      //          return {
      //             operator: 'equals',
      //             value,
      //          };
      //       },
      //    );
      //    filters[field] = { or: allAuthorisedValues };
      // }

      //
      // find unknown fields
      const res = this.findErrors('filtering field', inputFilters as Tree, '');
      if (res !== undefined) {
         errors.push(...res.errors);
      }

      // console.log('filters:', JSON.stringify(filters, null, 2));
      return { errors, filters };
   }

   sanitizeFilter(
      inputFilters: { [key: string]: unknown },
      fieldName: string, // Extract<keyof Fields, string>
      toSet: FiltersTree<unknown>,
   ):
      | {
           errors: InputErrors;
        }
      | undefined {
      const val = inputFilters[this.camelToInputStyle(fieldName)];
      if (val === undefined) {
         return undefined;
      }

      const errors: InputErrors = [];

      // toSet[fieldName] = {} as any;
      // for (const key in this.conf) {
      //    const res = this.conf[key].sanitizeFilter(val as { [key: string]: unknown }, key, toSet[fieldName] as any);
      //    if (res !== undefined) {
      //       errors.push(...res.errors);
      //    }
      // } TODO

      return {
         errors,
      };
   }

   // processFilter(field: Extract<keyof FilteringConfig<Fields>, string>, comparison: unknown): string | Comparison<any> {
   //    if (!isSomethingLike<FilteringConfig<Fields>>(comparison)) {
   //       return 'comparison object is not correct';
   //    }

   //    for (const key in this.conf) {
   //       const inputStyleKey = this.camelToInputStyle(key) as Extract<keyof Fields, string>;
   //       if (comparison[inputStyleKey] === undefined) {
   //          continue;
   //       }
   //       const res = this.conf[key].processFilter(key as any, comparison[inputStyleKey]);
   //    }
   //    // const fieldConf = this.validatorFilterMap.fields[field];
   //    //      const inputFieldName = this.camelToInputStyle(field);
   //    //      const comparison = inputFilters[inputFieldName];
   //    //      console.log('comparison:', comparison);
   //    //      if (comparison === undefined) {
   //    //         continue;
   //    //      }
   //    //      fieldConf.processFilter(field, comparison);

   //    return 'object cofn';
   //    //     for(const )
   //    //         this.conf[field].processFilter()
   // }

   sanitizeOptions(
      inputOptions: { [key: string]: unknown },
      MAX_LIMIT: number,
   ): {
      options: any; // Options<Extract<keyof Fields, string>>; // this type makes compile rror
      errors: InputErrors;
   } {
      const errors: InputErrors = [];
      const options: Options<Extract<keyof Fields, string>> = { pagination: { offset: 0, limit: 100 } };
      if (inputOptions !== undefined) {
         if (inputOptions.limit !== undefined) {
            if (isNumber(inputOptions.limit)) {
               options.pagination.limit = Math.min(inputOptions.limit as number, MAX_LIMIT);
            } else {
               errors.push({ context: 'option', fieldName: 'limit', reason: 'not a number' });
            }
         }
         if (inputOptions.offset !== undefined) {
            if (isNumber(inputOptions.offset)) {
               options.pagination.offset = inputOptions.offset;
            } else {
               errors.push({ context: 'option', fieldName: 'offset', reason: 'not a number' });
            }
         }
         // this.sanitizeOrderBy(inputOptions, options, errors);
      }
      return {
         options,
         errors,
      };
   }

   // private sanitizeOrderBy(
   //    inputOptions: { [key: string]: unknown },
   //    options: Options<Extract<keyof Fields, string>>,
   //    errors: InputErrors,
   // ): void {
   //    if (inputOptions.orderby === undefined) {
   //       return;
   //    }
   //    if (!isString(inputOptions.orderby)) {
   //       errors.push({ context: 'option', fieldName: 'orderby', reason: 'not a string' });
   //       return;
   //    }
   //    const [fieldname, sort] = (inputOptions.orderby as string).split(' ');
   //    if (fieldname === undefined) {
   //       errors.push({
   //          context: 'option',
   //          fieldName: 'orderby',
   //          reason: `bad format: it should be "field_name ${getOrderbySort().join('|')}"`,
   //       });
   //       return;
   //    }

   //    const cameledFieldName = this.inputStyleToCamel<string, Extract<keyof Fields, string>>(fieldname);
   //    if (this.validatorFilterMap.fields[cameledFieldName] === undefined) {
   //       errors.push({ context: 'option', fieldName: 'orderby', reason: `unknown field name ${fieldname}` });
   //       return;
   //    }
   //    if (!isOrderbySort(sort)) {
   //       errors.push({
   //          context: 'option',
   //          fieldName: 'orderby',
   //          reason: `incorrect sort ${sort}, available values: ${getOrderbySort().join('|')}`,
   //       });
   //       return;
   //    }
   //    options.orderby = { fieldname: cameledFieldName, sort };
   // }
}

export interface Options<FieldNames extends string> {
   pagination: {
      offset: number;
      limit: number;
   };
   orderby?: {
      fieldname: FieldNames;
      sort: OrderbySort;
   };
}
const orderbySort = ['asc', 'desc'] as const;
type OrderbySort = typeof orderbySort[number];
function isOrderbySort(o: any): o is OrderbySort {
   return o !== undefined && orderbySort.includes(o as OrderbySort);
}
function getOrderbySort(): OrderbySort[] {
   return orderbySort.map((o) => o);
}
