import { isBoolean, isDate, isNumber, isString } from './type-checkers';

type Leaf = string | number | Date | boolean;
// type Leaf= unknown
export interface Tree {
   [key: string]: Leaf | Tree;
}

export interface DomainFields {
   [key: string]: any;
}

export interface DomainExpandables extends DomainFields {}

export interface Options<Fields extends DomainFields> {
   pagination: {
      offset: number;
      limit: number;
   };
   orderby?: {
      fieldname: keyof Fields;
      sort: OrderbySort;
   };
}
const orderbySort = ['asc', 'desc'] as const;
export type OrderbySort = typeof orderbySort[number];
function isOrderbySort(o: any): o is OrderbySort {
   return o !== undefined && orderbySort.includes(o as OrderbySort);
}

type NaturalKey<Type extends string> = Type[];
export class DomainRequest<Name extends string, Fields extends DomainFields, Expandables extends DomainExpandables> {
   constructor(
      private readonly name: Name,
      private readonly naturalKey: NaturalKey<Extract<keyof Fields, string>>,
      private readonly fields: RequestableFields<Fields>,
      private readonly filters: FilteringFields<Fields>,
      private readonly expandables: {
         [Property in keyof Expandables]: DomainRequest<Name, Expandables[Property], any>;
      },
      private readonly options: Options<Fields>,
   ) {}

   getName(): Name {
      return this.name;
   }

   getOptions(): Options<Fields> {
      return this.options;
   }

   getFieldsNames(): Array<keyof RequestableFields<Fields>> {
      const ret: Array<keyof RequestableFields<Fields>> = [];
      for (const field in this.fields) {
         if (this.fields[field] === true) {
            ret.push(field);
         }
      }
      return ret;
   }

   getFields(): RequestableFields<Fields> {
      return this.fields;
   }

   // check the field:
   //  - is selectable (if simple field)
   //  - has a selectable (if extended field)
   isToSelectOrHasToSelect(key: keyof RequestableFields<Fields>): boolean {
      const fieldValue = this.fields[key];
      return this.checkIsToSelect(fieldValue);
   }

   private checkIsToSelect(o: boolean | RequestableFields<any>): boolean {
      if (o === undefined) {
         return false;
      }
      if (isBoolean(o)) {
         return o;
      }

      for (const key in o) {
         const res = this.checkIsToSelect(o[key]);
         if (res) {
            return true;
         }
      }
      return false;
   }

   setField(key: keyof RequestableFields<Fields>, value: boolean): void {
      this.fields[key] = value;
   }

   getFilters(): FilteringFields<Fields> {
      return this.filters;
   }

   setFilter(filter: {
      key: keyof FilteringFields<Fields>;
      operator: Operator;
      value: FilteringFields<Fields>[keyof FilteringFields<Fields>];
   }): void {
      (this.filters as any)[filter.key] = { and: [{ operator: filter.operator, value: filter.value }] };
   }

   getExpandables(): {
      [Property in keyof Expandables]: DomainRequest<Name, Expandables[Property], any>;
   } {
      return this.expandables;
   }

   getNaturalKey(): NaturalKey<Extract<keyof Fields, string>> {
      return this.naturalKey;
   }

   private selectCount = true;
   dontSelectCount(): void {
      this.selectCount = false;
   }

   isSelectCount(): boolean {
      return this.selectCount;
   }
}

export interface RequestValues<
   Name extends string,
   Fields extends DomainFields,
   Expandables extends DomainExpandables,
> {
   fields: RequestableFields<Fields>;
   filters: {
      filters: FilteringFields<Fields>;
      errors: InputErrors;
   };
   expandables: {
      [Property in keyof Expandables]: DomainRequest<Name, Expandables[Property], DomainFields>;
   };
   options: {
      options: Options<Fields>;
      errors: InputErrors;
   };
}

interface InputError {
   context: 'selected field' | 'filtering field' | 'option';
   fieldName: string;
   reason: string;
}

export type InputErrors = InputError[];
export abstract class DomainRequestBuilder<
   Name extends string,
   Fields extends DomainFields,
   Expandables extends DomainExpandables,
   Extended = {},
> {
   private static readonly MAX_LIMIT = 5000;

   constructor(
      protected readonly name: Name,
      private readonly naturalKey: NaturalKey<Extract<keyof Fields, string>>,
      private readonly validatorFilterMap: {
         [Property in keyof Fields]: {
            validate: Validator;
            defaultValue: Fields[Property];
            authorizedValues?: string[];
         };
      },
      private readonly extended?: {
         [Property in keyof Extended]: DomainRequestBuilder<string, any, any>;
      },
   ) {}

   build(
      input: any,
      dontExpandThese: Name[],
   ): {
      request: DomainRequest<Name, Fields, Expandables>;
      errors: InputErrors;
   } {
      const { fields, filters, options, expandables } = this.splitValues(input);

      const sanitizedFields = this.sanitizeFieldsToSelect(fields);
      const sanitizedFilters = this.sanitizeFilters(filters);
      const sanitizedOptions = this.sanitizeOptions(options);
      const expandablesRequests = this.buildExpandablesRequests(expandables, dontExpandThese);

      return {
         request: this.buildRequest({
            fields: sanitizedFields.fields,
            filters: sanitizedFilters,
            expandables: expandablesRequests.requests as any, // TODO fix that
            options: sanitizedOptions,
         }),
         errors: [
            ...sanitizedFields.errors,
            ...sanitizedFilters.errors,
            ...sanitizedOptions.errors,
            ...expandablesRequests.errors,
         ],
      };
   }

   protected camelToInputStyle<IN extends string, OUT extends string>(str: IN): OUT {
      return camelToSnake(str);
   }

   protected inputStyleToCamel<IN extends string, OUT extends string>(str: IN): OUT {
      return snakeToCamel(str);
   }

   private sanitizeFieldsToSelect(inputFieldsToSelect: Tree): {
      fields: RequestableFields<Fields>;
      errors: InputErrors;
   } {
      // const ignoredFields

      const fieldsToSelect = this.buildDefaultRequestableFields();
      for (const field in fieldsToSelect) {
         const snakedFieldName = this.camelToInputStyle(field);
         const val = inputFieldsToSelect[snakedFieldName];
         if (val !== undefined && (val === true || val === 1)) {
            fieldsToSelect[field] = true;
         }
      }

      const errors: InputErrors = [];

      if (this.extended !== undefined) {
         for (const field in this.extended) {
            const snakedFieldName = this.camelToInputStyle(field);
            const val = inputFieldsToSelect[snakedFieldName];
            const dr = this.extended[field].build(val, []);
            fieldsToSelect[field as keyof Fields] = dr.request.getFields(); // TODO fix this cast
            errors.push(...dr.errors);
         }
      }

      for (const snakedFieldname in inputFieldsToSelect) {
         const cameledFieldName = this.inputStyleToCamel<string, Extract<keyof Fields, string>>(snakedFieldname);
         if (fieldsToSelect[cameledFieldName] === undefined) {
            errors.push({
               context: 'selected field',
               fieldName: snakedFieldname,
               reason: `unknown field [${snakedFieldname}]`,
            });
         }
      }
      return { fields: fieldsToSelect, errors };
   }

   public buildDefaultRequestableFields(): RequestableFields<Fields> {
      const ret: any = {};
      for (const key in this.validatorFilterMap) {
         ret[key] = false;
      }
      return ret;
   }

   private buildDefaultFields(): Fields {
      const ret: any = {};
      for (const key in this.validatorFilterMap) {
         ret[key] = this.validatorFilterMap[key].defaultValue;
      }
      return ret;
   }

   private sanitizeFilters(inputFilters: { [key: string]: unknown }): {
      filters: FilteringFields<Fields>;
      errors: InputErrors;
   } {
      const filters: FilteringFields<Fields> = {};
      const errors: InputErrors = [];
      const fields = this.buildDefaultFields();
      const fieldsNames = Object.keys(fields) as Array<Extract<keyof Fields, string>>;

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

      // for each field with restrictions in "and and "or", check if it has values
      /// if not, add default in "or"
      for (const field of fieldsNames) {
         const validator = this.validatorFilterMap[field];
         if (validator.authorizedValues === undefined) {
            // no restrictions
            continue;
         }
         // this field has restrictions => check if it is present in filters
         if (filters[field] !== undefined) {
            // this field has validated values, so next
            continue;
         }

         // default values to add
         const arr = validator.authorizedValues.map(
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
         filters[field] = { or: arr };
      }

      for (const inputKey in inputFilters) {
         if (filtersArrays.includes(inputKey as FiltersArrays)) {
            continue;
         }
         const fieldName = this.inputStyleToCamel(inputKey);
         if (!fieldsNames.includes(fieldName as Extract<keyof Fields, string>)) {
            errors.push({ context: 'filtering field', fieldName: inputKey, reason: `[${inputKey}] is not a field` });
         }
      }

      return { filters, errors };
   }

   private processFilter(
      field: Extract<keyof Fields, string>,
      inputFilters: { [key: string]: unknown },
      filters: FilteringFields<Fields>,
      errors: InputErrors,
      filterGroupToUse: FiltersArrays,
   ): void {
      const inputFieldName = this.camelToInputStyle(field);
      const comparison = inputFilters[inputFieldName];

      const addConditionsToArray = (
         filters: FilteringFields<Fields>,
         field: Extract<keyof Fields, string>,
         arrayType: FiltersArrays,
         arr: Array<Comparison<Fields>>,
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
               arrToPopulate.find((c: Comparison<Fields>) => c.operator === toAdd.operator && c.value === toAdd.value)
            ) {
               arrToPopulate.push(...arr);
            }
         }
      };

      if (comparison === undefined) {
         return;
      }

      const res = this.validateFilterAndSetValue(field, comparison);
      if (!isComparison<Fields>(res)) {
         errors.push({ context: 'filtering field', fieldName: inputFieldName, reason: res });
         return;
      }

      addConditionsToArray(filters, field, filterGroupToUse, [res]);
   }

   private validateFilterAndSetValue(field: keyof Fields, comparison: any): string | Comparison<Fields> {
      if (comparison.operator === undefined) {
         return `missing comparison operator for key [${field as string}]`;
      }
      const operator: Operator = this.inputStyleToCamel(comparison.operator);
      if (!getOperators().includes(operator)) {
         return `invalid comparison operator [${comparison.operator as string}] for key [${field as string}]`;
      }

      if (comparison.value === undefined) {
         return `missing comparison value for key [${field as string}]`;
      }

      const validator = this.validatorFilterMap[field];
      if (validator.authorizedValues !== undefined && !validator.authorizedValues.includes(comparison.value)) {
         return `value [${comparison.value as string}] is not authorized`;
      }

      const validation = validator.validate(comparison.value);
      if (validation.valid) {
         return {
            operator,
            value: comparison.value,
         };
      }

      return `invalid comparison value [${comparison.value as string}] for key [${field as string}]: ${
         validation.reason
      }`;
   }

   private sanitizeOptions(inputOptions: { [key: string]: unknown }): {
      options: Options<Fields>;
      errors: InputErrors;
   } {
      const errors: InputErrors = [];
      const options: Options<Fields> = { pagination: { offset: 0, limit: 100 } };

      if (inputOptions !== undefined) {
         if (inputOptions.limit !== undefined) {
            if (isNumber(inputOptions.limit)) {
               options.pagination.limit = Math.min(inputOptions.limit, DomainRequestBuilder.MAX_LIMIT);
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
      options: Options<Fields>,
      errors: InputErrors,
   ): void {
      if (inputOptions.orderby === undefined) {
         return;
      }
      if (!isString(inputOptions.orderby)) {
         errors.push({ context: 'option', fieldName: 'orderby', reason: 'not a string' });
         return;
      }
      const [fieldname, sort] = inputOptions.orderby.split(' ');
      if (fieldname === undefined) {
         errors.push({
            context: 'option',
            fieldName: 'orderby',
            reason: `bad format: it should be "field_name ${orderbySort.join('|')}"`,
         });
         return;
      }
      if (this.validatorFilterMap[fieldname] === undefined) {
         errors.push({ context: 'option', fieldName: 'orderby', reason: `unknown field name ${fieldname}` });
         return;
      }
      if (!isOrderbySort(sort)) {
         errors.push({
            context: 'option',
            fieldName: 'orderby',
            reason: `incorrect sort ${sort}, available values: ${orderbySort.join('|')}`,
         });
         return;
      }
      options.orderby = { fieldname, sort };
   }

   private expReqBuilders:
      | {
           [Property in keyof Expandables]: DomainRequestBuilder<Name, DomainFields, DomainExpandables>;
        }
      | undefined;

   setExpandables(expandablesRequestsBuilders: {
      [Property in keyof Expandables]: DomainRequestBuilder<Name, DomainFields, DomainExpandables>;
   }): void {
      this.expReqBuilders = expandablesRequestsBuilders;
   }

   private buildExpandablesRequests(
      inputFieldsToSelect: Tree,
      dontDoThese: Name[],
   ): {
      requests: {
         [Property in keyof Expandables]: DomainRequest<Name, Fields, Expandables>;
      };
      errors: InputErrors;
   } {
      if (this.expReqBuilders === undefined) {
         throw new Error(`Request builder ${this.name} not initialized with Expandables Requests builders`);
      }
      const ret: any = { requests: {}, errors: [] };
      for (const key in this.expReqBuilders) {
         if (dontDoThese.includes(key as unknown as Name)) {
            continue;
         }
         const input = inputFieldsToSelect[this.camelToInputStyle(key)] as Tree;
         const built = (this.expReqBuilders[key] as DomainRequestBuilder<Name, DomainFields, DomainExpandables>).build(
            input,
            [...dontDoThese, this.name],
         );
         ret.requests[key] = built.request;
         ret.errors.push(...built.errors);
      }
      return ret;
   }

   protected splitValues(input: Tree): {
      fields: { [key: string]: any };
      filters: { [key: string]: any };
      options: { [key: string]: any };
      expandables: { [key: string]: any };
   } {
      let fields = {};
      let filters = {};
      let options = {};
      let expandables = {};
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
         if (input.expandables !== undefined) {
            expandables = input.expandables;
         }
      }
      return {
         fields,
         filters,
         options,
         expandables,
      };
   }

   protected buildRequest(values: RequestValues<Name, Fields, Expandables>): DomainRequest<Name, Fields, Expandables> {
      return new DomainRequest<Name, Fields, Expandables>(
         this.name,
         this.naturalKey,
         values.fields,
         values.filters.filters,
         values.expandables,
         values.options.options,
      );
   }
}

export class DomainRequestBuilderWithExtended<
   Name extends string,
   Fields extends DomainFields,
   Extended,
> extends DomainRequestBuilder<Name, Fields, {}, Extended> {}

export class SimpleDomainRequestBuilder<Name extends string, Fields extends DomainFields> extends DomainRequestBuilder<
   Name,
   Fields,
   {},
   {}
> {}

export type Validator = (val: any) => { valid: boolean; reason: string };

// https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
export type RequestableFields<Type> = {
   [Property in keyof Type]: boolean | RequestableFields<any>;
};
type Unarray<T> = T extends Array<infer U> ? NestedRequestableFields<U> : NestedRequestableFields<T>;

export type NestedRequestableFields<Type> = {
   [Property in keyof Type]: Type[Property] extends string | number | boolean ? boolean : Unarray<Type[Property]>;
};

type Toarray<T> = T extends Array<infer U> ? Array<NestedFilteringFields<U>> : NestedFilteringFields<T>;
export type NestedFilteringFields<Type> = {
   [Property in keyof Type]?: Type[Property] extends string | number | boolean
      ? Type[Property]
      : Toarray<Type[Property]>;
};

const operators = [
   'equals',
   'greaterThan',
   'greaterThanOrEquals',
   'lesserThan',
   'lesserThanOrEquals',
   'contains', // for strings
   'includes', // for numbers list
] as const;
export type Operator = typeof operators[number];
export function getOperators(): Operator[] {
   return operators.map((o) => o);
}

const filtersArrays = ['or', 'and'] as const;
export type FiltersArrays = typeof filtersArrays[number];

export function isComparison<T>(o: any): o is Comparison<T> {
   return o.operator !== undefined && o.value !== undefined;
}
export interface Comparison<Type extends DomainFields> {
   operator: Operator;
   value: Type[Extract<keyof Type, string>];
}
export function isAndArrayComparison<T>(o: any): o is AndArrayComparison<T> {
   return o.and !== undefined;
}
export function isOrArrayComparison<T>(o: any): o is OrArrayComparison<T> {
   return o.or !== undefined;
}
export interface AndArrayComparison<Type extends DomainFields> {
   and: Array<Comparison<Type>>;
}
export interface OrArrayComparison<Type extends DomainFields> {
   or: Array<Comparison<Type>>;
}

export type FilteringFields<Type extends DomainFields> = {
   [Property in keyof Type]?: AndArrayComparison<Type> | OrArrayComparison<Type>; // | Comparison<Type>;
};

// https://stackoverflow.com/questions/60269936/typescript-convert-generic-object-from-snake-to-camel-case
// type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
//    ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
//    : S;

export type CamelToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
   ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${CamelToSnakeCase<U>}`
   : S;

export function snakeToCamel<IN extends string, OUT extends string>(str: IN): OUT {
   return str.replace(/_[a-z]/g, (part) => `${part.charAt(1).toUpperCase()}`) as OUT;
}

export function camelToSnake<IN extends string, OUT extends string>(str: IN): OUT {
   return str.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`) as OUT;
}

export function validateId(val: any): { valid: boolean; reason: string } {
   const valid = isString(val);
   return { valid, reason: 'not a string' };
}

export function validateNumber(val: any): { valid: boolean; reason: string } {
   const valid = isNumber(val);
   return { valid, reason: 'not a number' };
}

export function validateDate(val: any): { valid: boolean; reason: string } {
   const valid = isDate(val);
   return { valid, reason: 'not a date' };
}

export function validateString(val: any): { valid: boolean; reason: string } {
   const valid = isString(val);
   return { valid, reason: 'not a string' };
}

export function validateBoolean(val: any): { valid: boolean; reason: string } {
   const valid = isBoolean(val);
   return { valid, reason: 'not a boolean' };
}
