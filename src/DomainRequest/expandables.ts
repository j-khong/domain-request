/* eslint-disable @typescript-eslint/brace-style */
import { AddOnManager, HasExpandables, IsExpandable } from './addons.ts';
import { SimpleDomainRequest, SimpleDomainRequestBuilder } from './simple.ts';
import {
   DomainFields,
   FilteringFields,
   InputErrors,
   NaturalKey,
   Options,
   RequestableFields,
   Tree,
   Validator,
} from './types.ts';

export interface DomainExpandables extends DomainFields {}

export abstract class DomainWithExpandablesRequestBuilder<
      Name extends string,
      Fields extends DomainFields,
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
   ) {
      super(name, naturalKey, validatorFilterMap);
      this.addonsManager = new AddOnManager();
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

      const expandablesRequests = this.addonsManager
         .getExpandables<Name, Fields, Expandables>(this.name)
         .buildExpandablesRequests(this.name, this.camelToInputStyle, expandables, dontExpandThese);

      return {
         request: new DomainWithExpandablesRequest<Name, Fields, Expandables>(
            this.name,
            this.naturalKey,
            sanitizedFields.fields,
            sanitizedFilters.filters,
            sanitizedOptions.options,
            this.getFieldsToCompute(),
            expandablesRequests.requests,
         ),

         errors: [
            ...sanitizedFields.errors,
            ...sanitizedFilters.errors,
            ...sanitizedOptions.errors,
            ...expandablesRequests.errors,
         ],
      };
   }

   setExpandables(expandablesRequestsBuilders: {
      [Property in keyof Expandables]: DomainWithExpandablesRequestBuilder<Name, Fields, Expandables>;
   }): void {
      this.addonsManager.setExpandables(this.name, expandablesRequestsBuilders);
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

export class DomainWithExpandablesRequest<
      Name extends string,
      Fields extends DomainFields,
      Expandables extends DomainExpandables,
   >
   extends SimpleDomainRequest<Name, Fields>
   implements IsExpandable<Name, Fields, Expandables>
{
   constructor(
      name: Name,
      naturalKey: NaturalKey<Extract<keyof Fields, string>>,
      fields: RequestableFields<Fields>,
      filters: FilteringFields<Fields>,
      options: Options<Fields>,
      fieldsToCompute: Map<Extract<keyof Fields, string>, any>,
      private readonly expandables: {
         [Property in keyof Expandables]: SimpleDomainRequest<Name, any>;
      },
   ) {
      super(name, naturalKey, fields, filters, options, fieldsToCompute);
   }

   getExpandables(): {
      [Property in keyof Expandables]: SimpleDomainRequest<Name, any>;
   } {
      return this.expandables;
   }

   getFields(): RequestableFields<Fields> {
      return this.fields;
   }
}
