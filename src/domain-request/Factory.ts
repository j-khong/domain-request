import { DomainResult, DomainRequestBuilder, DomainRequest } from './builder.ts';
import { Persistence } from '../persistence/index.ts';
import { DomainConfig } from './field-configuration/index.ts';

export function initFactories<DRN extends string, Role extends string, DF>(
   // select: SelectMethod,
   factories: {
      [Property in DRN]: Factory<Role, DRN, DF>;
   },
): void {
   const builders: any = {};
   // const dbTables: any = {};
   for (const requestNameKey in factories) {
      const f = factories[requestNameKey as DRN];
      builders[requestNameKey] = f.getAllRolesRequestBuilders();
      // dbTables[requestNameKey] = f.dbTable;
   }

   // for (const requestNameKey in factories) {
   //    const factory = factories[requestNameKey as DRN];
   //    // factory.dbTable.init(select, dbTables);
   // }
}

export interface DomainRequestHandler<Role extends string, DRN extends string, DF> {
   getRoleDomainRequestBuilder: (role: Role) => DomainRequestBuilder<DRN, DF>;
   fetchDomain: (req: DomainRequest<DRN, DF>) => Promise<DomainResult>;
}

export interface Factory<Role extends string, DRN extends string, Fields> {
   getAllRolesRequestBuilders: () => DomainBuildersByRole<Role, DRN, DomainRequestBuilder<DRN, Fields>>;
   getRoleDomainRequestBuilder: (role: Role) => DomainRequestBuilder<DRN, Fields>;
   fetchDomain: (req: DomainRequest<DRN, Fields>) => Promise<DomainResult>;
   // datastore: Persistence<DRN, Fields>;
}

export function buildDomainRequestFactory<R extends string, DRN extends string, Fields>( //, TF extends string>(
   buildFctOfDomainRequestBuilderByRole: {
      [Property in R]: {
         buildRequestBuilder: () => DomainRequestBuilder<DRN, Fields>;
      };
   },
   datastore: Persistence<DRN, Fields>,
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
      fetchDomain: async (req: DomainRequest<DRN, Fields>) => datastore.fetch(req),
      // datastore,
   };
}

export type DomainRequestByRole<R extends string, DRN extends string, F> = {
   [Property in R]: {
      buildRequestBuilder: () => DomainRequestBuilder<DRN, F>;
      createDomainConfig: () => DomainConfig<DRN, F>;
   };
};

type DomainBuildersByRole<
   Role extends string,
   Name extends string,
   RequestBuilder extends DomainRequestBuilder<Name, any>,
> = {
   [Property in Role]: RequestBuilder;
};
