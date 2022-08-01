/* eslint-disable @typescript-eslint/brace-style */
import { AddOnManager, IsExtended } from './addons.ts';
import { SimpleDomainRequest, SimpleDomainRequestBuilder } from './simple.ts';
import { isBoolean } from './type-checkers.ts';
import {
   DomainFields,
   FilteringFields,
   InputErrors,
   NaturalKey,
   Options,
   RequestableFields,
   Validator,
} from './types.ts';

export class DomainWithExtendedRequestBuilder<
   Name extends string,
   Fields extends DomainFields,
   Extended,
> extends SimpleDomainRequestBuilder<Name, Fields> {
   private readonly addonsManager: AddOnManager;
   constructor(
      name: Name,
      naturalKey: NaturalKey<Extract<keyof Fields, string>>,
      validatorFilterMap: {
         [Property in keyof Fields]: {
            validate: Validator;
            defaultValue: Fields[Property];
            authorizedValues?: Fields[Property][];
         };
      },
      private readonly extended: {
         [Property in keyof Extended]: SimpleDomainRequestBuilder<any, any>;
      },
   ) {
      super(name, naturalKey, validatorFilterMap);
      this.addonsManager = new AddOnManager();
      this.addonsManager.setExtended(this.getName());
   }

   build(input: any): {
      request: SimpleDomainRequest<Name, Fields>;
      errors: InputErrors;
   } {
      const { fields, filters, options } = this.splitValues(input);

      const sanitizedFields = this.sanitizeFieldsToSelect(fields);
      const sanitizedFilters = this.sanitizeFilters(filters);
      const sanitizedOptions = this.sanitizeOptions(options);

      const extendedDomainRequests = this.addonsManager
         .getExtended<Name, Fields, Extended>(this.name)
         .buildExtendedRequests(this.extended, this.camelToInputStyle, fields, sanitizedFields);

      return {
         request: new DomainWithExtendedRequest<Name, Fields, Extended>(
            this.name,
            this.naturalKey,
            sanitizedFields.fields,
            sanitizedFilters.filters,
            sanitizedOptions.options,
            this.getFieldsToCompute(),
            extendedDomainRequests,
         ),
         errors: [...sanitizedFields.errors, ...sanitizedFilters.errors, ...sanitizedOptions.errors],
      };
   }

   public buildDefaultRequestableFields(): RequestableFields<Fields> {
      const ret = super.buildDefaultRequestableFields();

      for (const key in this.extended) {
         ret[key] = false;
      }
      return ret;
   }
}

export class DomainWithExtendedRequest<Name extends string, Fields extends DomainFields, Extended>
   extends SimpleDomainRequest<Name, Fields>
   implements IsExtended<Name, Fields, Extended>
{
   constructor(
      name: Name,
      naturalKey: NaturalKey<Extract<keyof Fields, string>>,
      fields: RequestableFields<Fields>,
      filters: FilteringFields<Fields>,
      options: Options<Fields>,
      fieldsToCompute: Map<Extract<keyof Fields, string>, any>,
      private readonly extended: {
         [Property in keyof Extended]: SimpleDomainRequest<Name, Fields>;
      },
   ) {
      super(name, naturalKey, fields, filters, options, fieldsToCompute);
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

   getExtendedFields(k: Extract<keyof Extended, string>): RequestableFields<Extended> | undefined {
      return this.getFields()[k] as RequestableFields<Extended>;
   }

   getExtended(): {
      [Property in keyof Extended]: SimpleDomainRequest<Name, Fields>;
   } {
      return this.extended;
   }
}
