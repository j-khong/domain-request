import { DomainResult } from './persistence';
import { SelectMethod, DatabaseTable } from './persistence/database';
import { DomainExpandables, DomainFields, DomainRequest, DomainRequestBuilder } from './DomainRequest';

export function initFactories<DomainRequestName extends string, Role extends string>(
   select: SelectMethod,
   factories: {
      [Property in DomainRequestName]: Factory<Role, DomainRequestName>;
   },
): void {
   const builders: any = {};
   const dbTables: any = {};
   for (const requestNameKey in factories) {
      const f = factories[requestNameKey as DomainRequestName];
      builders[requestNameKey] = f.getAllRolesRequestBuilders();
      dbTables[requestNameKey] = f.dbTable;
   }

   for (const requestNameKey in factories) {
      const factory = factories[requestNameKey as DomainRequestName];
      factory.initRolesBuilders(builders);
      factory.dbTable.init(select, dbTables);
   }
}

export function initAllRolesDomainRequestBuilders<
   DomainRequestName extends string,
   Role extends string,
   Fields extends DomainFields,
   Expandables extends DomainExpandables,
>(
   builders: {
      [Property in DomainRequestName]: Builder<
         Role,
         DomainRequestName,
         Fields,
         Expandables,
         DomainRequestBuilder<DomainRequestName, Fields, Expandables>
      >;
   },
   domainRequestToInit: DomainRequestName,
   expandables: Array<DomainRequestName | { globalContext: DomainRequestName; currentContext: keyof Expandables }>,
): void {
   const requestBuilderToInit = builders[domainRequestToInit];
   for (const keyRole in requestBuilderToInit) {
      const ret: any = {};
      for (const k of expandables) {
         let global = k;
         let current = k as string;
         if (typeof k === 'object') {
            global = k.globalContext;
            current = k.currentContext as string;
         }
         ret[current] = builders[global as DomainRequestName][keyRole];
      }
      requestBuilderToInit[keyRole].setExpandables(ret);
   }
}

export type Builder<
   Role extends string,
   Name extends string,
   Fields extends DomainFields,
   Expandables extends DomainExpandables,
   RequestBuilder extends DomainRequestBuilder<Name, Fields, Expandables>,
> = {
   [Property in Role]: RequestBuilder;
};

export interface DomainRequestHandler<Role extends string, DomainRequestName extends string> {
   getRoleDomainRequestBuilder: (role: Role) => DomainRequestBuilder<DomainRequestName, any, any>;
   fetchData: (req: DomainRequest<DomainRequestName, any, any>) => Promise<DomainResult>;
}

export interface Factory<Role extends string, DomainRequestName extends string> {
   getAllRolesRequestBuilders: () => Builder<
      Role,
      DomainRequestName,
      any,
      any,
      DomainRequestBuilder<DomainRequestName, any, any>
   >;
   getRoleDomainRequestBuilder: (role: Role) => DomainRequestBuilder<DomainRequestName, any, any>;
   fetchData: (req: DomainRequest<DomainRequestName, any, any>) => Promise<DomainResult>;
   initRolesBuilders: (allbuilders: {
      [Property in DomainRequestName]: Builder<
         Role,
         DomainRequestName,
         any,
         any,
         DomainRequestBuilder<DomainRequestName, any, any>
      >;
   }) => void;
   dbTable: DatabaseTable<DomainRequestName, any, any, any>;
}

export function getFactory<R extends string, DRM extends string, F, E, TF extends string>(
   builder: Builder<R, DRM, F, E, DomainRequestBuilder<DRM, F, E>>,
   dbTable: DatabaseTable<DRM, F, E, TF>,
   init: (builders: {
      [Property in DRM]: Builder<R, DRM, F, E, DomainRequestBuilder<DRM, F, E>>;
   }) => void,
): Factory<R, DRM> {
   return {
      getAllRolesRequestBuilders: () => builder,
      getRoleDomainRequestBuilder: (role: R) => builder[role],
      initRolesBuilders: init,
      fetchData: async (req) => dbTable.fetch(req),
      dbTable,
   };
}
