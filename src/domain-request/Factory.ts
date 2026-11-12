import { DomainResult, DomainResultItem, DomainRequestBuilder, DomainRequest } from './builder.ts';
import { Persistence } from '../persistence/index.ts';
import { DomainConfig, FieldsSetup, ObjectFieldConfiguration } from './field-configuration/index.ts';

export interface DomainRequestHandler<Role extends string, DRN extends string, DF> {
   getRoleDomainRequestBuilder: (role: Role) => DomainRequestBuilder<DRN, DF>;
   fetchDomain: (req: DomainRequest<DRN, DF>) => Promise<DomainResult<DomainResultItem<DF>>>;
}

export interface Factory<Role extends string, DRN extends string, Fields> {
   getAllRolesRequestBuilders: () => DomainBuildersByRole<Role, DRN, DomainRequestBuilder<DRN, Fields>>;
   getRoleDomainRequestBuilder: (role: Role) => DomainRequestBuilder<DRN, Fields>;
   fetchDomain: (req: DomainRequest<DRN, Fields>) => Promise<DomainResult<DomainResultItem<Fields>>>;
   // datastore: Persistence<DRN, Fields>;
}

// the fields are inferred from the request builders only: a datastore is often not typed with the domain
type NoInfer<T> = [T][T extends any ? 0 : never];

export function buildDomainRequestFactory<R extends string, DRN extends string, Fields>( //, TF extends string>(
   buildFctOfDomainRequestBuilderByRole: {
      [Property in R]: {
         buildRequestBuilder: () => DomainRequestBuilder<DRN, Fields>;
      };
   },
   datastore: Persistence<DRN, NoInfer<Fields>>,
): Factory<R, DRN, Fields> {
   const domainRequestBuilderByRole: {
      [Property in R]: DomainRequestBuilder<DRN, Fields>;
   } = {} as {
      [Property in R]: DomainRequestBuilder<DRN, Fields>;
   };
   for (const k in buildFctOfDomainRequestBuilderByRole) {
      domainRequestBuilderByRole[k] = buildFctOfDomainRequestBuilderByRole[k].buildRequestBuilder();
   }
   return {
      getAllRolesRequestBuilders: () => domainRequestBuilderByRole,
      getRoleDomainRequestBuilder: (role: R) => domainRequestBuilderByRole[role],
      fetchDomain: (req: DomainRequest<DRN, Fields>) => datastore.fetch(req),
      // datastore,
   };
}

export type DomainRequestByRole<R extends string, DRN extends string, F> = {
   [Property in R]: {
      buildRequestBuilder: () => DomainRequestBuilder<DRN, F>;
      /**
       *
       * @param toIgnore domain names to ignore, when 2 domains are mutually imported
       */
      createDomainConfig: (toIgnore?: string[]) => DomainConfig<DRN, F>;
   };
};

type DomainBuildersByRole<
   Role extends string,
   Name extends string,
   RequestBuilder extends DomainRequestBuilder<Name, any>,
> = {
   [Property in Role]: RequestBuilder;
};

export function createDomainConfig<DRN extends string, T>(
   drn: DRN,
   fields: FieldsSetup<T>,
   authorizedFields?: (keyof T)[],
): DomainConfig<DRN, T> {
   const fieldsToUse = getAuthorizedFields(fields, authorizedFields);
   return {
      name: drn,
      fields: new ObjectFieldConfiguration<T>(fieldsToUse),
   };
}

function getAuthorizedFields<T>(fields: FieldsSetup<T>, authorizedFields?: (keyof T)[]): FieldsSetup<T> {
   let fieldsToUse: FieldsSetup<T> = fields;
   if (authorizedFields !== undefined) {
      fieldsToUse = {} as FieldsSetup<T>;
      for (const key in fields) {
         if (authorizedFields.includes(key)) {
            fieldsToUse[key] = fields[key];
         }
      }
   }
   return fieldsToUse;
}
