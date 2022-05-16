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
   orderby?: keyof Fields;
}
export type OptionsErrors = Array<{
   optionName: string;
   reason: string;
}>;

export function initDomainRequest<
   DomainRequestName extends string,
   Role extends string,
   Fields extends DomainFields,
   Expandables extends DomainExpandables,
>(
   builders: {
      [Property in DomainRequestName]: Builder<
         Role,
         DomainRequestName,
         Fields,
         Expandables,
         DomainRequestBuilder<DomainRequestName, Fields, Expandables>
      >;
   },
   domainRequestToInit: DomainRequestName,
   expandables: DomainRequestName[],
): void {
   const requestBuilderToInit = builders[domainRequestToInit];
   for (const keyRole in requestBuilderToInit) {
      const ret: any = {};
      for (const expName of expandables) {
         ret[expName] = builders[expName][keyRole];
      }
      requestBuilderToInit[keyRole].init(ret);
   }
}

type NaturalKey = string | number | symbol;
export abstract class DomainRequest<
   Name extends string,
   Fields extends DomainFields,
   Expandables extends DomainExpandables,
> {
   private readonly options: Options<Fields>;
   private readonly naturalKey: NaturalKey;
   constructor(
      private readonly name: Name,
      private readonly fields: RequestableFields<Fields>,
      private readonly filters: FilteringFields<Fields>,
      private readonly expandables: {
         [Property in keyof Expandables]: DomainRequest<Name, Expandables[Property], any>;
      },
      options: Options<Fields>,
      naturalKey: keyof Fields,
   ) {
      this.options = options;
      this.naturalKey = naturalKey;
   }

   getName(): Name {
      return this.name;
   }

   getOptions(): Options<Fields> {
      return this.options;
   }

   getFieldsNames(): Array<keyof RequestableFields<Fields>> {
      const ret: Array<keyof RequestableFields<Fields>> = [];
      for (const field in this.fields) {
         if (this.fields[field]) {
            ret.push(field);
         }
      }
      return ret;
   }

   getFields(): RequestableFields<Fields> {
      return this.fields;
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
      (this.filters as any)[filter.key] = { operator: filter.operator, value: filter.value };
   }

   getExpandables(): {
      [Property in keyof Expandables]: DomainRequest<Name, Expandables[Property], any>;
   } {
      return this.expandables;
   }

   getNaturalKey(): NaturalKey {
      return this.naturalKey;
   }
}

export abstract class DomainRequestBuilder<
   Name extends string,
   Fields extends DomainFields,
   Expandables extends DomainExpandables,
> {
   private static readonly MAX_LIMIT = 5000;

   constructor(
      protected readonly name: Name,
      private readonly validatorFilterMap: { [Property in keyof Fields]: Validator },
   ) {}

   protected abstract buildRequest(
      fields: RequestableFields<Fields>,
      filters: {
         filters: FilteringFields<Fields>;
         errors: FilteringFieldsErrors;
      },
      expandables: unknown,
      options: {
         options: Options<Fields>;
         errors: OptionsErrors;
      },
   ): DomainRequest<Name, Fields, Expandables>;

   build(
      input: Tree,
      dontDoThese: Name[],
   ): {
      request: DomainRequest<Name, Fields, Expandables>;
      errors: Array<{
         fieldName: string;
         reason: string;
      }>;
   } {
      const { fields, filters, options, expandables } = this.splitValues(input);

      const sanitizedFields = this.sanitizeFieldsToSelect(fields);
      const sanitizedFilters = this.sanitizeFilters(filters);
      const sanitizedOptions = this.sanitizeOptions(options);
      const expandablesRequests = this.buildExpandablesRequests(expandables, dontDoThese);

      return {
         request: this.buildRequest(sanitizedFields, sanitizedFilters, expandablesRequests.requests, sanitizedOptions),
         errors: [...sanitizedFilters.errors, ...expandablesRequests.errors],
      };
   }

   protected camelToInputStyle<IN extends string, OUT extends string>(str: IN): OUT {
      return camelToSnake(str);
   }

   private sanitizeFieldsToSelect(inputFieldsToSelect: Tree): RequestableFields<Fields> {
      // const ignoredFields

      const fieldsToSelect = this.buildDefaultRequestableFields();
      for (const field in fieldsToSelect) {
         const snakedFieldName = this.camelToInputStyle(field);
         const val = inputFieldsToSelect[snakedFieldName];
         if (val !== undefined && (val === true || val === 1)) {
            fieldsToSelect[field] = true;
         }
      }

      return fieldsToSelect;
   }

   abstract buildDefaultRequestableFields(): RequestableFields<Fields>;

   private sanitizeFilters(inputFilters: { [key: string]: unknown }): {
      filters: FilteringFields<Fields>;
      errors: Array<{
         fieldName: string;
         reason: string;
      }>;
   } {
      const fields = this.buildDefaultFields();

      const errors: Array<{
         fieldName: string;
         reason: string;
      }> = [];

      const filters: FilteringFields<Fields> = {};
      for (const field in fields) {
         const inputFieldName = this.camelToInputStyle(field);
         const comparison = inputFilters[inputFieldName];

         if (comparison === undefined) {
            continue;
         }
         const error = this.validateFilterAndSetValue(filters, field, comparison);
         if (error !== undefined) {
            errors.push({ fieldName: inputFieldName, reason: error });
            continue;
         }
      }
      return { filters, errors };
   }

   protected abstract buildDefaultFields(): Fields;

   private validateFilterAndSetValue(
      filters: FilteringFields<Fields>,
      field: keyof Fields,
      comparison: any,
   ): string | undefined {
      if (comparison.operator === undefined) {
         return `missing comparison operator for key [${field as string}]`;
      }
      if (!getOperators().includes(comparison.operator)) {
         return `invalid comparison operator [${comparison.operator as string}] for key [${field as string}]`;
      }
      if (comparison.value === undefined) {
         return `missing comparison value for key [${field as string}]`;
      }
      const validator = this.validatorFilterMap[field];
      const validation = validator(comparison.value);
      if (validation.valid) {
         filters[field] = comparison;
         return undefined;
      }

      return `invalid comparison value [${comparison.value as string}] for key [${field as string}]: ${
         validation.reason
      }`;
   }

   private sanitizeOptions(inputOptions: { [key: string]: unknown }): {
      options: Options<Fields>;
      errors: Array<{
         optionName: string;
         reason: string;
      }>;
   } {
      const options = { pagination: { offset: 0, limit: 100 } };
      if (inputOptions !== undefined) {
         if (inputOptions.limit !== undefined && isNumber(inputOptions.limit)) {
            options.pagination.limit = Math.min(inputOptions.limit, DomainRequestBuilder.MAX_LIMIT);
         }
         if (inputOptions.offset !== undefined && isNumber(inputOptions.offset)) {
            options.pagination.offset = inputOptions.offset;
         }
         // TODO sanitize orderby
      }
      return {
         options,
         errors: [],
      };
   }

   private expReqBuilders:
      | {
           [Property in keyof Expandables]: DomainRequestBuilder<Name, DomainFields, DomainExpandables>;
        }
      | undefined;

   init(expandablesRequestsBuilders: {
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
      errors: Array<{
         fieldName: string;
         reason: string;
      }>;
   } {
      if (this.expReqBuilders === undefined) {
         throw new Error('Request builder not initialized with Expandables Requests builders');
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
}

export type Builder<
   Role extends string,
   Name extends string,
   Fields extends DomainFields,
   Expandables extends DomainExpandables,
   RequestBuilder extends DomainRequestBuilder<Name, Fields, Expandables>,
> = {
   [Property in Role]: RequestBuilder;
};

export type Validator = (val: any) => { valid: boolean; reason: string };

// https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
export type RequestableFields<Type> = {
   [Property in keyof Type]: boolean;
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

export type FilteringFields<Type extends DomainFields> = {
   [Property in keyof Type]?: {
      operator: Operator;
      value: Type[Property];
   };
};
export type FilteringFieldsErrors = Array<{
   fieldName: string;
   reason: string;
}>;

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

// export abstract class DomainUser {
//    abstract getRole(): string;
// }
