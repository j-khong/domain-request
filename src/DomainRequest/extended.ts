/* eslint-disable @typescript-eslint/brace-style */
import { AddOnManager, IsExtended } from './addons';
import { SimpleDomainRequest, SimpleDomainRequestBuilder } from './simple';
import { isBoolean } from './type-checkers';
import { DomainFields, FilteringFields, InputErrors, NaturalKey, Options, RequestableFields, Validator } from './types';

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
            authorizedValues?: string[];
         };
      },
      private readonly extended: {
         [Property in keyof Extended]: SimpleDomainRequestBuilder<any, any>;
      },
   ) {
      super(name, naturalKey, validatorFilterMap);
      this.addonsManager = new AddOnManager();
      this.addonsManager.setExtended(this.name);
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
            extendedDomainRequests,
         ),
         errors: [...sanitizedFields.errors, ...sanitizedFilters.errors, ...sanitizedOptions.errors],
      };
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
      private readonly extended: {
         [Property in keyof Extended]: SimpleDomainRequest<Name, Fields>;
      },
   ) {
      super(name, naturalKey, fields, filters, options);
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
