import { SimpleDomainRequest, SimpleDomainRequestBuilder } from './simple';
import { DomainFields, FilteringFields, InputErrors, NaturalKey, Options, RequestableFields, Tree } from './types';

export interface DomainExpandables extends DomainFields {}

export abstract class DomainWithExpandablesRequestBuilder<
   Name extends string,
   Fields extends DomainFields,
   Expandables extends DomainExpandables,
> extends SimpleDomainRequestBuilder<Name, Fields> {
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
      const expandablesRequests = this.buildExpandablesRequests(expandables, dontExpandThese);

      return {
         request: new DomainWithExpandablesRequest<Name, Fields, Expandables>(
            this.name,
            this.naturalKey,
            sanitizedFields.fields,
            sanitizedFilters.filters,
            sanitizedOptions.options,
            expandablesRequests.requests as any, // TODO fix that
         ),

         errors: [
            ...sanitizedFields.errors,
            ...sanitizedFilters.errors,
            ...sanitizedOptions.errors,
            ...expandablesRequests.errors,
         ],
      };
   }

   private expReqBuilders:
      | {
           [Property in keyof Expandables]: DomainWithExpandablesRequestBuilder<Name, DomainFields, DomainExpandables>;
        }
      | undefined;

   setExpandables(expandablesRequestsBuilders: {
      [Property in keyof Expandables]: DomainWithExpandablesRequestBuilder<Name, DomainFields, DomainExpandables>;
   }): void {
      this.expReqBuilders = expandablesRequestsBuilders;
   }

   private buildExpandablesRequests(
      inputFieldsToSelect: Tree,
      dontDoThese: Name[],
   ): {
      requests: {
         [Property in keyof Expandables]: SimpleDomainRequest<Name, Fields>;
      };
      errors: InputErrors;
   } {
      if (this.expReqBuilders === undefined) {
         throw new Error(`Request builder ${this.name} not initialized with Expandables Requests builders`);
      }
      const ret: any = { requests: {}, errors: [] };
      for (const key in this.expReqBuilders) {
         // key can be a currentContext name => take the global context name
         const globalContextName = this.expReqBuilders[key].name;
         if (dontDoThese.includes(globalContextName)) {
            continue;
         }
         const input = inputFieldsToSelect[this.camelToInputStyle(key)] as Tree;
         const built = (
            this.expReqBuilders[key] as DomainWithExpandablesRequestBuilder<Name, DomainFields, DomainExpandables>
         ).build(input, [...dontDoThese, this.name]);
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
> extends SimpleDomainRequest<Name, Fields> {
   constructor(
      name: Name,
      naturalKey: NaturalKey<Extract<keyof Fields, string>>,
      fields: RequestableFields<Fields>,
      filters: FilteringFields<Fields>,
      options: Options<Fields>,
      private readonly expandables: {
         [Property in keyof Expandables]: SimpleDomainRequest<Name, any>;
      },
   ) {
      super(name, naturalKey, fields, filters, options);
   }

   getExpandables(): {
      [Property in keyof Expandables]: SimpleDomainRequest<Name, any>;
   } {
      return this.expandables;
   }
}
