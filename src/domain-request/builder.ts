import { isSomethingLike } from './type-checkers.ts';
import { InputErrors, NaturalKey, Tree, BoolTree, RequestableFields } from './types.ts';
import { DomainConfig, FiltersTree, Options } from './field-configuration/index.ts';
import { DomainRequestHandler } from './Factory.ts';

export interface DomainResult {
   domainName: string;
   results: any[];
   report: Report;
   total: number;
   errors: string[];
}

export interface Report {
   requests: Array<RequestReport>;
}

export interface RequestReport {
   request: string;
   timeInMs: number;
   error?: string;
}

export interface DomainRequest<Name extends string, T> {
   name: Name;
   naturalKey: NaturalKey<Extract<keyof T, string>>;
   fields: RequestableFields<T>;
   filters: FiltersTree<T>;
   options: Options<Extract<keyof T, string>>;
}

export class DomainRequestBuilder<Name extends string, T> {
   constructor(
      protected readonly name: Name,
      protected readonly naturalKey: NaturalKey<Extract<keyof T, string>>,
      protected readonly domainConfig: DomainConfig<Name, T>,
      private readonly MAX_LIMIT = 5000,
   ) {
      if (naturalKey.length === 0) {
         throw new Error(`Configuration error, natural keys array must not be empty for [${name}]`);
      }
   }

   getName(): Name {
      return this.name;
   }

   build(input: unknown): {
      request: DomainRequest<Name, T>;
      errors: InputErrors;
   } {
      const { fields, filters, options } = this.splitValues(input);

      const sanitizedFields = this.domainConfig.fields.sanitizeFields(fields);
      const sanitizedFilters = this.domainConfig.fields.sanitizeFilters(filters);
      const sanitizedOptions = this.domainConfig.fields.sanitizeOptions(options, this.MAX_LIMIT);

      return {
         request: {
            name: this.name,
            naturalKey: this.naturalKey,
            fields: sanitizedFields.fields,
            filters: sanitizedFilters.filters,
            options: sanitizedOptions.options,
         },
         errors: [...sanitizedFields.errors, ...sanitizedFilters.errors, ...sanitizedOptions.errors],
      };
   }

   createInputRequestType() {
      const manageUndefined = (field: 'fields' | 'filters', s: string | undefined): string =>
         s === undefined ? '' : `${field}?:${s}`;

      const fieldsType = this.domainConfig.fields.createInputFieldsType();
      const filtersType = this.domainConfig.fields.createInputFiltersType();

      return `{
         ${manageUndefined('fields', fieldsType)}
         ${manageUndefined('filters', filtersType)}
      }`;
   }

   protected splitValues(input: unknown): {
      fields: BoolTree;
      filters: Tree;
      options: Tree;
   } {
      let fields: BoolTree = {};
      let filters: Tree = {};
      let options: Tree = {};
      if (input !== undefined) {
         if (isSomethingLike<{ fields: BoolTree }>(input) && input.fields !== undefined) {
            fields = input.fields as BoolTree;
         }
         if (isSomethingLike<{ filters: Tree }>(input) && input.filters !== undefined) {
            filters = input.filters as Tree;
         }
         if (isSomethingLike<{ options: Tree }>(input) && input.options !== undefined) {
            options = input.options as Tree;
         }
      }
      return {
         fields,
         filters,
         options,
      };
   }
}

export function generateRequestsTypes<DomainRequestName extends string, Role extends string, DF>(
   drn: DomainRequestName[],
   roles: Role[],
   getDomainRequestHandler: (name: DomainRequestName) => DomainRequestHandler<Role, DomainRequestName, DF>,
) {
   const requestTypes = new Map<DomainRequestName, { [property in Role]: string }>();
   for (const domainName of drn) {
      const handler = getDomainRequestHandler(domainName);

      const byRoles: { [property in Role]: string } = {} as { [property in Role]: string };
      for (const role of roles) {
         const domainRequestBuilder = handler.getRoleDomainRequestBuilder(role);
         byRoles[role] = domainRequestBuilder.createInputRequestType();
      }
      requestTypes.set(domainName, byRoles);
   }
   return requestTypes;
}
