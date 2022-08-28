import { camelToSnake, snakeToCamel } from './converters.ts';
import { isNumber, isString } from './type-checkers.ts';
import {
   Comparison,
   FilteringFields,
   FiltersArrays,
   getFiltersArrays,
   getOperators,
   InputErrors,
   isComparison,
   NaturalKey,
   Operator,
   RequestableFields,
   Tree,
   BoolTree,
   Leaf,
} from './types.ts';
import { FiltersValidators } from './validators.ts';

export class DomainRequestBuilder<Name extends string, FieldNames extends string> {
   constructor(
      protected readonly name: Name,
      protected readonly naturalKey: NaturalKey<FieldNames>,
      protected readonly validatorFilterMap: Domain<Name, FieldNames>,
      private readonly MAX_LIMIT = 5000,
   ) {}

   getName(): Name {
      return this.name;
   }

   build(input: Tree): {
      // request: SimpleDomainRequest<Name, Fields>;
      fields: any;
      errors: InputErrors;
   } {
      const { fields, filters, options } = this.splitValues(input);

      const sanitizedFields = this.sanitizeFieldsToSelect(fields);
      const sanitizedFilters = this.sanitizeFilters(filters);
      const sanitizedOptions = this.sanitizeOptions(options);

      return {
         // request: new SimpleDomainRequest<Name, Fields>(
         //    this.name,
         //    this.naturalKey,
         //    sanitizedFields.fields,
         //    sanitizedFilters.filters,
         //    sanitizedOptions.options,
         //    this.toCompute,
         // ),
         fields: sanitizedFields.fields,
         errors: [...sanitizedFields.errors, ...sanitizedFilters.errors, ...sanitizedOptions.errors],
      };
   }

   private camelToInputStyle<IN extends string, OUT extends string>(str: IN): OUT {
      return camelToSnake(str);
   }

   private inputStyleToCamel<IN extends string, OUT extends string>(str: IN): OUT {
      return snakeToCamel(str);
   }

   private sanitizeFieldsToSelect(inputFieldsToSelect: BoolTree): {
      fields: RequestableFields<DomainFields<FieldNames>>;
      errors: InputErrors;
   } {
      const fieldsToSelect = this.buildDefaultRequestableFields();
      // console.log('buildDefaultRequestableFields:', JSON.stringify(fieldsToSelect, null, 2));
      // console.log('buildDefaultFields:', JSON.stringify(this.buildDefaultFields(), null, 2));

      const compare = (field: string, input: BoolTree, toSet: BoolTree) => {
         const val = input[this.camelToInputStyle(field)];
         if (val !== undefined) {
            if (typeof val === 'boolean') {
               if (val === true /* || val === 1*/) {
                  toSet[field] = true;
               }
            } else {
               // console.log('not bool', val, toSet[field]);
               for (const f in toSet[field] as BoolTree) {
                  compare(f, val, toSet[field] as BoolTree);
               }
            }
         }
      };
      for (const f in fieldsToSelect) {
         compare(f, inputFieldsToSelect, fieldsToSelect);
      }
      // for (const f in fieldsToSelect) {
      //    const field = f;
      //    const val = inputFieldsToSelect[this.camelToInputStyle(field)];
      //    if (val !== undefined) {
      //       if (val === true || val === 1) {
      //          fieldsToSelect[field] = true;
      //       }
      //       // else if (this.toCompute.has(field)) {
      //       //    fieldsToSelect[field] = true;
      //       //    this.toCompute.set(field, val);
      //       // }
      //    }
      // }

      const errors: InputErrors = [];

      const findErrors = (snakedFieldname: string, input: BoolTree, toSet: BoolTree, previous = '') => {
         const cameledFieldName = this.inputStyleToCamel(snakedFieldname);
         const val = toSet[cameledFieldName];
         if (val === undefined) {
            errors.push({
               context: 'selected field',
               fieldName: snakedFieldname,
               reason: `unknown field [${previous}${snakedFieldname}]`,
            });
         } else {
            if (typeof val !== 'boolean') {
               for (const f in input[snakedFieldname] as BoolTree) {
                  findErrors(f, input[snakedFieldname] as BoolTree, val, `${previous}${snakedFieldname}.`);
               }
            }
         }
      };

      for (const snakedFieldname in inputFieldsToSelect) {
         findErrors(snakedFieldname, inputFieldsToSelect, fieldsToSelect);
         // const cameledFieldName = this.inputStyleToCamel<string, Extract<FieldNames, string>>(snakedFieldname);
         // if (fieldsToSelect[cameledFieldName] === undefined) {
         //    errors.push({
         //       context: 'selected field',
         //       fieldName: snakedFieldname,
         //       reason: `unknown field [${snakedFieldname}]`,
         //    });
         // }
      }
      return { fields: fieldsToSelect, errors };
   }

   private buildDefaultRequestableFields(): RequestableFields<DomainFields<FieldNames>> {
      const ret: RequestableFields<DomainFields<FieldNames>> = {} as RequestableFields<DomainFields<FieldNames>>;
      for (const key in this.validatorFilterMap.fields) {
         const res = this.validatorFilterMap.fields[key].getDefaultRequestableValue([this.validatorFilterMap.name]);
         if (res !== undefined) {
            ret[key] = res;
         }
      }
      return ret;
   }

   private buildDefaultFields(): Tree {
      const ret: Tree = {} as Tree;
      // const ret: any = {};
      for (const key in this.validatorFilterMap.fields) {
         const res = this.validatorFilterMap.fields[key].getDefaultValue([this.validatorFilterMap.name]);
         if (res !== undefined) {
            ret[key] = res as Tree;
         }
      }
      return ret;
   }

   private sanitizeFilters(inputFilters: { [key: string]: unknown }): {
      filters: FilteringFields<DomainFields<FieldNames>>; //FilteringFields<Fields>;
      errors: InputErrors;
   } {
      const filters: FilteringFields<DomainFields<FieldNames>> = {};
      const errors: InputErrors = [];

      const fieldsNames = Object.keys(this.buildDefaultFields()) as Array<
         Extract<keyof DomainFields<FieldNames>, string>
      >;
      console.log('fieldsNames:', fieldsNames);
      console.log('inputFilters:', inputFilters);

      // process the fields directly in filters and add them to "and" array
      for (const field of fieldsNames) {
         this.processFilter(field, inputFilters, filters, errors, 'and');
      }

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
               for (const field of fieldsNames) {
                  this.processFilter(field, obj, filters, errors, arrayType);
               }
            }
         }
      }

      // for each field with restrictions in "and" and "or", check if it has values
      /// if not, add default in "or"
      for (const field of fieldsNames) {
         const fieldConf = this.validatorFilterMap.fields[field];
         if (!fieldConf.hasRestrictedValues()) {
            // no restrictions
            continue;
         }
         // this field has restrictions => check if it is present in filters
         if (filters[field] !== undefined) {
            // this field has validated values, so next
            continue;
         }

         // this field has restrictions and is not used for filtering
         // => default values to add
         const allAuthorisedValues = fieldConf.getAuthorizedValues().map(
            (
               value,
            ): {
               operator: Operator;
               value: any;
            } => {
               return {
                  operator: 'equals',
                  value,
               };
            },
         );
         filters[field] = { or: allAuthorisedValues };
      }

      for (const inputKey in inputFilters) {
         if (getFiltersArrays().includes(inputKey as FiltersArrays)) {
            continue;
         }
         const fieldName = this.inputStyleToCamel(inputKey);
         if (!fieldsNames.includes(fieldName as Extract<FieldNames, string>)) {
            errors.push({ context: 'filtering field', fieldName: inputKey, reason: `[${inputKey}] is not a field` });
         }
      }

      return { filters, errors };
   }

   private processFilter(
      field: Extract<FieldNames, string>,
      inputFilters: { [key: string]: unknown },
      filters: FilteringFields<DomainFields<FieldNames>>,
      errors: InputErrors,
      filterGroupToUse: FiltersArrays,
   ): void {
      const inputFieldName = this.camelToInputStyle(field);
      const comparison = inputFilters[inputFieldName];

      console.log('comparison:', comparison);
      if (comparison === undefined) {
         return;
      }

      const res = this.validateFilterAndSetValue(field, comparison);
      if (!isComparison<any>(res)) {
         errors.push({ context: 'filtering field', fieldName: inputFieldName, reason: res });
         return;
      }

      const addConditionsToArray = (
         filters: FilteringFields<DomainFields<FieldNames>>,
         field: Extract<FieldNames, string>,
         arrayType: FiltersArrays,
         arr: Array<Comparison<any>>,
      ): void => {
         if (filters[field] === undefined) {
            (filters[field] as any) = {};
         }

         if ((filters[field] as any)[arrayType] === undefined) {
            (filters[field] as any)[arrayType] = [];
         }

         const arrToPopulate = (filters[field] as any)[arrayType];
         for (const toAdd of arr) {
            if (
               undefined ===
               arrToPopulate.find((c: Comparison<any>) => c.operator === toAdd.operator && c.value === toAdd.value)
            ) {
               arrToPopulate.push(...arr);
            }
         }
      };
      addConditionsToArray(filters, field, filterGroupToUse, [res]);
   }

   private validateFilterAndSetValue(field: Extract<FieldNames, string>, comparison: any): string | Comparison<any> {
      const inputFieldName = this.camelToInputStyle(field);
      if (comparison.operator === undefined) {
         return `missing comparison operator for key [${inputFieldName}]`;
      }

      if (comparison.value === undefined) {
         return `missing comparison value for key [${inputFieldName}]`;
      }

      const operator: Operator = this.inputStyleToCamel(comparison.operator);
      if (!getOperators().includes(operator)) {
         return `invalid comparison operator [${comparison.operator as string}] for key [${inputFieldName}]`;
      }

      const fieldConf = this.validatorFilterMap.fields[field];
      if (!fieldConf.isAccepted(operator)) {
         return `you cannot use comparison operator [${operator}] with key [${inputFieldName}]`;
      }

      if (!fieldConf.isAuthorised(comparison.value)) {
         return `value [${comparison.value as string}] is not authorized`;
      }

      const validation = fieldConf.validate(comparison.value);
      if (validation.valid) {
         return {
            operator,
            value: comparison.value,
         };
      }

      return `invalid comparison value [${comparison.value as string}] for key [${inputFieldName}]: ${
         validation.reason
      }`;
   }

   protected splitValues(input: Tree): {
      fields: BoolTree;
      filters: Tree;
      options: Tree;
   } {
      let fields = {};
      let filters = {};
      let options = {};
      if (input !== undefined) {
         if (input.fields !== undefined) {
            fields = input.fields;
         }
         if (input.filters !== undefined) {
            filters = input.filters;
         }
         if (input.options !== undefined) {
            options = input.options;
         }
      }
      return {
         fields,
         filters,
         options,
      };
   }
   protected sanitizeOptions(inputOptions: { [key: string]: unknown }): {
      options: Options<FieldNames>;
      errors: InputErrors;
   } {
      const errors: InputErrors = [];
      const options: Options<FieldNames> = { pagination: { offset: 0, limit: 100 } };

      if (inputOptions !== undefined) {
         if (inputOptions.limit !== undefined) {
            if (isNumber(inputOptions.limit)) {
               options.pagination.limit = Math.min(inputOptions.limit as number, this.MAX_LIMIT);
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
         this.sanitizeOrderBy(inputOptions, options, errors);
      }
      return {
         options,
         errors,
      };
   }

   private sanitizeOrderBy(
      inputOptions: { [key: string]: unknown },
      options: Options<FieldNames>,
      errors: InputErrors,
   ): void {
      if (inputOptions.orderby === undefined) {
         return;
      }
      if (!isString(inputOptions.orderby)) {
         errors.push({ context: 'option', fieldName: 'orderby', reason: 'not a string' });
         return;
      }
      const [fieldname, sort] = (inputOptions.orderby as string).split(' ');
      if (fieldname === undefined) {
         errors.push({
            context: 'option',
            fieldName: 'orderby',
            reason: `bad format: it should be "field_name ${getOrderbySort().join('|')}"`,
         });
         return;
      }

      const cameledFieldName = this.inputStyleToCamel<string, Extract<FieldNames, string>>(fieldname);
      if (this.validatorFilterMap.fields[cameledFieldName] === undefined) {
         errors.push({ context: 'option', fieldName: 'orderby', reason: `unknown field name ${fieldname}` });
         return;
      }
      if (!isOrderbySort(sort)) {
         errors.push({
            context: 'option',
            fieldName: 'orderby',
            reason: `incorrect sort ${sort}, available values: ${getOrderbySort().join('|')}`,
         });
         return;
      }
      options.orderby = { fieldname: cameledFieldName, sort };
   }

   // private readonly toCompute: Map<Extract<FieldNames, string>, any> = new Map();
   // addToCompute(arr: Array<Extract<FieldNames, string>>): void {
   //    for (const comp of arr) {
   //       this.toCompute.set(comp, {});
   //    }
   // }

   // protected getFieldsToCompute(): Map<Extract<FieldNames, string>, any> {
   //    return this.toCompute;
   // }
}

// export class SimpleDomainRequest<Name extends string, Fields extends DomainFields> {
//    constructor(
//       protected readonly name: Name,
//       protected readonly naturalKey: NaturalKey<Extract<keyof Fields, string>>,
//       protected readonly fields: RequestableFields<Fields>,
//       protected readonly filters: FilteringFields<Fields>,
//       protected readonly options: Options<Fields>,
//       protected readonly fieldsToCompute: Map<Extract<keyof Fields, string>, any>,
//    ) {}

//    getName(): Name {
//       return this.name;
//    }

//    getOptions(): Options<Fields> {
//       return this.options;
//    }

//    getFieldsNames(): Array<keyof RequestableFields<Fields>> {
//       const ret: Array<keyof RequestableFields<Fields>> = [];
//       for (const field in this.fields) {
//          if (this.fields[field] === true) {
//             ret.push(field);
//          }
//       }
//       return ret;
//    }

//    getFieldsToCompute(): Map<Extract<keyof Fields, string>, any> {
//       return this.fieldsToCompute;
//    }

//    getFields(): RequestableFields<Fields> {
//       return this.fields;
//    }

//    setField(key: keyof RequestableFields<Fields>, value: boolean): void {
//       this.fields[key] = value;
//    }

//    getFilters(): FilteringFields<Fields> {
//       return this.filters;
//    }

//    setFilter(filter: {
//       key: keyof FilteringFields<Fields>;
//       operator: Operator;
//       value: any; //FilteringFields<Fields>[keyof FilteringFields<Fields>];
//    }): void {
//       (this.filters as any)[filter.key] = { and: [{ operator: filter.operator, value: filter.value }] };
//    }

//    getNaturalKey(): NaturalKey<Extract<keyof Fields, string>> {
//       return this.naturalKey;
//    }

//    getId(): Extract<keyof Fields, string> {
//       return this.naturalKey[0];
//    }

//    private selectCount = true;
//    dontSelectCount(): void {
//       this.selectCount = false;
//    }

//    isSelectCount(): boolean {
//       return this.selectCount;
//    }
// }

type FieldFilteringConfig<T> = {
   filtering?: {
      byRangeOfValue?: boolean;
      byListOfValue?: boolean;
   };
   values: {
      default: T;
      authorized?: Array<T>;
   };
};

export type DefaultFieldValues<Type> = {
   [Property in keyof Type]: Type[Property] | DefaultFieldValues<unknown>;
};

abstract class DomainFieldConfiguration {
   init(o: Domain<string, string>) {}
   abstract getDefaultValue(dontDoThese: string[]): unknown | undefined;
   abstract getDefaultRequestableValue(dontDoThese: string[]): boolean | RequestableFields<unknown> | undefined;

   // abstract isAccepted(operator:Operator): boolean; // acceptedOperators.includes(operator)
   isAccepted(op: Operator): boolean {
      return true;
   } // TODO implements in children

   isAuthorised(o: unknown): boolean {
      // validator.authorizedValues !== undefined && !validator.authorizedValues.includes(o)
      return true;
   } // TODO implements in children

   hasRestrictedValues(): boolean {
      // return validator.authorizedValues !== undefined
      return false;
   }
   getAuthorizedValues(): ReadonlyArray<Readonly<unknown>> {
      return [];
   }

   validate(o: unknown): { valid: boolean; reason: string } {
      // validator.authorizedValues !== undefined && !validator.authorizedValues.includes(o)
      return { valid: true, reason: 'not correct' };
   } // TODO implements in children
}

export class FieldConfiguration<T extends string | number | boolean> extends DomainFieldConfiguration {
   constructor(private readonly conf: FieldFilteringConfig<T>) {
      super();
   }
   getDefaultValue(): T {
      return this.conf.values.default;
   }

   getDefaultRequestableValue(): boolean {
      return false;
   }
}

type FilteringConfig<T> = {
   [Property in keyof T]: FilteringConfChoice<T, Property>;
};

type FilteringConfChoice<T, Property extends keyof T> = Unarray<T[Property]> extends string | number | boolean
   ? FieldConfiguration<Unarray<T[Property]>>
   : ObjectFieldConfiguration<Unarray<T[Property]>>;

type Unarray<T> = T extends Array<infer U> ? U : T;

export class ObjectFieldConfiguration<T> extends DomainFieldConfiguration {
   constructor(private readonly conf: FilteringConfig<T>) {
      super();
   }

   getDefaultValue(): T {
      return this.recursiveDefautValue(this.conf);
   }

   private recursiveDefautValue(input: FilteringConfig<T>): T {
      const ret: T = {} as T;
      for (const k in input) {
         const elem = (input as any)[k];
         if (elem instanceof FieldConfiguration) {
            ret[k] = elem.getDefaultValue();
         } else {
            (ret as any)[k] = this.recursiveDefautValue(elem.conf);
         }
      }
      return ret;
   }

   getDefaultRequestableValue(): RequestableFields<T> {
      return this.recursiveDefautRequestableValue(this.conf);
   }

   private recursiveDefautRequestableValue(input: FilteringConfig<T>): RequestableFields<T> {
      const ret: RequestableFields<T> = {} as RequestableFields<T>;
      for (const k in input) {
         const elem = (input as any)[k];
         if (elem instanceof FieldConfiguration) {
            ret[k] = elem.getDefaultRequestableValue();
         } else {
            ret[k] = this.recursiveDefautRequestableValue(elem.conf);
         }
      }
      return ret;
   }
}

class CommonLinkedDomainConfiguration<FieldNames extends string> extends DomainFieldConfiguration {
   constructor(private readonly mainDomain: string, private readonly linkedDomain: string) {
      super();
   }

   private dom: Domain<string, FieldNames> | undefined;
   init(i: Domain<string, FieldNames>) {
      this.dom = i;
   }

   getDefaultValue(dontDoThese: string[]): unknown | undefined {
      const ret: any = {};
      const domain = this.getDomain();
      if (dontDoThese.includes(domain.name)) {
         return undefined;
      }

      const newArr = [...dontDoThese, domain.name];
      for (const k in domain.fields) {
         const res = domain.fields[k].getDefaultValue(newArr);
         if (res !== undefined) {
            ret[k] = res;
         }
      }
      return ret;
   }

   getDefaultRequestableValue(dontDoThese: string[]): RequestableFields<DomainFields<FieldNames>> | undefined {
      const ret: any = {};
      const domain = this.getDomain();

      if (dontDoThese.includes(domain.name)) {
         return undefined;
      }
      const newArr = [...dontDoThese, domain.name];
      for (const k in domain.fields) {
         const res = domain.fields[k].getDefaultRequestableValue(newArr);
         if (res !== undefined) {
            ret[k] = res;
         }
      }
      return ret;
   }

   private getDomain(): Domain<string, FieldNames> {
      if (undefined === this.dom) {
         throw new Error(
            `Confguration error, please init LinkedDomainConfiguration [${this.linkedDomain}] used by [${this.mainDomain}]`,
         );
      }
      return this.dom;
   }
}

export class LinkedDomainConfiguration<FieldNames extends string> extends CommonLinkedDomainConfiguration<FieldNames> {}

export class ArrayOfLinkedDomainConfiguration<
   FieldNames extends string,
> extends CommonLinkedDomainConfiguration<FieldNames> {}

export type Domain<Name extends string, T extends string> = {
   name: Name;
   fields: DomainFields<T>;
};
export type DomainFields<T extends string> = {
   [p in T]: DomainFieldConfiguration;
};

interface Options<FieldNames extends string> {
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
