/* eslint-disable @typescript-eslint/brace-style */
import { AddOnManager, HasExpandables, IsExpandable, IsExtended } from './addons';
import { DomainExpandables, DomainWithExpandablesRequestBuilder } from './expandables';
import { SimpleDomainRequest, SimpleDomainRequestBuilder } from './simple';
import { isBoolean } from './type-checkers';
import {
   DomainFields,
   FilteringFields,
   InputErrors,
   NaturalKey,
   Options,
   RequestableFields,
   Tree,
   Validator,
} from './types';

export class DomainWithExtendedAndExpandablesRequestBuilder<
      Name extends string,
      Fields extends DomainFields,
      Extended,
      Expandables extends DomainExpandables,
   >
   extends SimpleDomainRequestBuilder<Name, Fields>
   implements HasExpandables<Name, Fields, Expandables>
{
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

   setExpandables(expandablesRequestsBuilders: {
      [Property in keyof Expandables]: DomainWithExpandablesRequestBuilder<Name, Fields, Expandables>;
   }): void {
      this.addonsManager.setExpandables(this.name, expandablesRequestsBuilders);
   }

   build(
      input: any,
      dontExpandThese: Name[] = [],
   ): {
      request: SimpleDomainRequest<Name, Fields>;
      errors: InputErrors;
   } {
      const { fields, filters, options, expandables } = this.splitValues(input);

      const sanitizedFields = this.sanitizeFieldsToSelect(fields);
      const sanitizedFilters = this.sanitizeFilters(filters);
      const sanitizedOptions = this.sanitizeOptions(options);

      const extendedDomainRequests = this.addonsManager
         .getExtended<Name, Fields, Extended>(this.name)
         .buildExtendedRequests(this.extended, this.camelToInputStyle, fields, sanitizedFields);

      const expandablesRequests = this.addonsManager
         .getExpandables<Name, Fields, Expandables>(this.name)
         .buildExpandablesRequests(this.name, this.camelToInputStyle, expandables, dontExpandThese);

      return {
         request: new DomainWithExtendedAndExpandablesRequest<Name, Fields, Extended, Expandables>(
            this.name,
            this.naturalKey,
            sanitizedFields.fields,
            sanitizedFilters.filters,
            sanitizedOptions.options,
            extendedDomainRequests,
            expandablesRequests.requests,
         ),
         errors: [...sanitizedFields.errors, ...sanitizedFilters.errors, ...sanitizedOptions.errors],
      };
   }

   protected splitValues(input: Tree): {
      fields: { [key: string]: any };
      filters: { [key: string]: any };
      options: { [key: string]: any };
      expandables: { [key: string]: any };
   } {
      const { fields, filters, options } = super.splitValues(input);
      let expandables = {};
      if (input !== undefined) {
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
export class DomainWithExtendedAndExpandablesRequest<
      Name extends string,
      Fields extends DomainFields,
      Extended,
      Expandables extends DomainExpandables,
   >
   extends SimpleDomainRequest<Name, Fields>
   implements IsExtended<Name, Fields, Extended>, IsExpandable<Name, Fields, Expandables>
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
      private readonly expandables: {
         [Property in keyof Expandables]: SimpleDomainRequest<Name, any>;
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

   getExpandables(): {
      [Property in keyof Expandables]: SimpleDomainRequest<Name, any>;
   } {
      return this.expandables;
   }
}
