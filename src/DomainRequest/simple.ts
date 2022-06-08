import { camelToSnake, snakeToCamel } from './converters';
import { isNumber, isString } from './type-checkers';
import {
   Comparison,
   DomainFields,
   FilteringFields,
   FiltersArrays,
   getFiltersArrays,
   getOperators,
   getOrderbySort,
   InputErrors,
   isComparison,
   isOrderbySort,
   NaturalKey,
   Operator,
   Options,
   RequestableFields,
   Tree,
   Validator,
} from './types';

export class SimpleDomainRequestBuilder<Name extends string, Fields extends DomainFields> {
   constructor(
      protected readonly name: Name,
      protected readonly naturalKey: NaturalKey<Extract<keyof Fields, string>>,
      protected readonly validatorFilterMap: {
         [Property in keyof Fields]: {
            validate: Validator;
            defaultValue: Fields[Property];
            authorizedValues?: string[];
         };
      },
      private readonly MAX_LIMIT = 5000,
   ) {}

   getName(): Name {
      return this.name;
   }

   build(input: any): {
      request: SimpleDomainRequest<Name, Fields>;
      errors: InputErrors;
   } {
      const { fields, filters, options } = this.splitValues(input);

      const sanitizedFields = this.sanitizeFieldsToSelect(fields);
      const sanitizedFilters = this.sanitizeFilters(filters);
      const sanitizedOptions = this.sanitizeOptions(options);

      return {
         request: new SimpleDomainRequest<Name, Fields>(
            this.name,
            this.naturalKey,
            sanitizedFields.fields,
            sanitizedFilters.filters,
            sanitizedOptions.options,
         ),
         errors: [...sanitizedFields.errors, ...sanitizedFilters.errors, ...sanitizedOptions.errors],
      };
   }

   protected camelToInputStyle<IN extends string, OUT extends string>(str: IN): OUT {
      return camelToSnake(str);
   }

   protected inputStyleToCamel<IN extends string, OUT extends string>(str: IN): OUT {
      return snakeToCamel(str);
   }

   protected sanitizeFieldsToSelect(inputFieldsToSelect: Tree): {
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

   protected buildDefaultFields(): Fields {
      const ret: any = {};
      for (const key in this.validatorFilterMap) {
         ret[key] = this.validatorFilterMap[key].defaultValue;
      }
      return ret;
   }

   protected sanitizeFilters(inputFilters: { [key: string]: unknown }): {
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
         if (getFiltersArrays().includes(inputKey as FiltersArrays)) {
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

   private validateFilterAndSetValue(
      field: Extract<keyof Fields, string>,
      comparison: any,
   ): string | Comparison<Fields> {
      if (comparison.operator === undefined) {
         return `missing comparison operator for key [${field}]`;
      }

      if (comparison.value === undefined) {
         return `missing comparison value for key [${field}]`;
      }

      const operator: Operator = this.inputStyleToCamel(comparison.operator);
      if (!getOperators().includes(operator)) {
         return `invalid comparison operator [${comparison.operator as string}] for key [${field}]`;
      }

      if (operator === 'isIn' && !this.naturalKey.includes(field)) {
         return `you cannot use comparison operator [${
            comparison.operator as string
         }] with key [${field}] as it is not part of natural key`;
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

      return `invalid comparison value [${comparison.value as string}] for key [${field}]: ${validation.reason}`;
   }

   protected sanitizeOptions(inputOptions: { [key: string]: unknown }): {
      options: Options<Fields>;
      errors: InputErrors;
   } {
      const errors: InputErrors = [];
      const options: Options<Fields> = { pagination: { offset: 0, limit: 100 } };

      if (inputOptions !== undefined) {
         if (inputOptions.limit !== undefined) {
            if (isNumber(inputOptions.limit)) {
               options.pagination.limit = Math.min(inputOptions.limit, this.MAX_LIMIT);
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
            reason: `bad format: it should be "field_name ${getOrderbySort().join('|')}"`,
         });
         return;
      }

      const cameledFieldName = this.inputStyleToCamel(fieldname);
      if (this.validatorFilterMap[cameledFieldName] === undefined) {
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

   protected splitValues(input: Tree): {
      fields: { [key: string]: any };
      filters: { [key: string]: any };
      options: { [key: string]: any };
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
}

export class SimpleDomainRequest<Name extends string, Fields extends DomainFields> {
   constructor(
      protected readonly name: Name,
      protected readonly naturalKey: NaturalKey<Extract<keyof Fields, string>>,
      protected readonly fields: RequestableFields<Fields>,
      protected readonly filters: FilteringFields<Fields>,
      protected readonly options: Options<Fields>,
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
