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

export function getFactory<
   R extends string,
   DRN extends string,
   F extends DomainFields,
   E extends DomainExpandables,
   TF extends string,
>(
   builder: Builder<R, DRN, F, E, DomainRequestBuilder<DRN, F, E>>,
   dbTable: DatabaseTable<DRN, F, E, TF>,
   domainRequestToInit: DRN,
   expandables: Array<ExpandableName<DRN, E>>,
): Factory<R, DRN> {
   return {
      getAllRolesRequestBuilders: () => builder,
      getRoleDomainRequestBuilder: (role: R) => builder[role],
      initRolesBuilders: (allBuilders: {
         [Property in DRN]: Builder<R, DRN, F, E, DomainRequestBuilder<DRN, F, E>>;
      }) => initAllRolesDomainRequestBuilders(allBuilders, domainRequestToInit, expandables),
      fetchData: async (req) => dbTable.fetch(req),
      dbTable,
   };
}

export type ExpandableName<DomainRequestName extends string, Expandables extends DomainExpandables> =
   | DomainRequestName
   | { globalContext: DomainRequestName; currentContext: keyof Expandables };

function initAllRolesDomainRequestBuilders<
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
   expandables: Array<ExpandableName<DomainRequestName, Expandables>>,
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
type Builder<
   Role extends string,
   Name extends string,
   Fields extends DomainFields,
   Expandables extends DomainExpandables,
   RequestBuilder extends DomainRequestBuilder<Name, Fields, Expandables>,
> = {
   [Property in Role]: RequestBuilder;
};
