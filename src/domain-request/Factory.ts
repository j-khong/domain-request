import { DomainResult, DomainRequestBuilder, DomainRequest } from './builder.ts';
import { Persistence } from '../persistence/index.ts';

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

export function getFactory<R extends string, DRN extends string, Fields>( //, TF extends string>(
   builder: {
      [Property in R]: DomainRequestBuilder<DRN, Fields>;
   },
   datastore: Persistence<DRN, Fields>,
): Factory<R, DRN, Fields> {
   return {
      getAllRolesRequestBuilders: () => builder,
      getRoleDomainRequestBuilder: (role: R) => builder[role],
      fetchDomain: async (req: DomainRequest<DRN, Fields>) => datastore.fetch(req),
      // datastore,
   };
}

type DomainBuildersByRole<
   Role extends string,
   Name extends string,
   RequestBuilder extends DomainRequestBuilder<Name, any>,
> = {
   [Property in Role]: RequestBuilder;
};

type AllBuilders<Role extends string, Name extends string> = {
   [Property in Name]: DomainBuildersByRole<Role, Name, DomainRequestBuilder<Name, any>>;
};
