import { DomainResult } from './persistence/index.ts';
import { SelectMethod, SimpleDatabaseTable, ExtendableDatabaseTable } from './persistence/database/index.ts';

import {
   DomainExpandables,
   DomainFields,
   SimpleDomainRequest,
   DomainWithExpandablesRequestBuilder,
   SimpleDomainRequestBuilder,
   DomainWithExtendedRequestBuilder,
   DomainWithExtendedAndExpandablesRequestBuilder,
} from './DomainRequest/index.ts';

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
      factory.initRolesBuildersWithExpandables(builders);
      factory.dbTable.init(select, dbTables);
   }
}

export interface DomainRequestHandler<Role extends string, DomainRequestName extends string, DF> {
   getRoleDomainRequestBuilder: (role: Role) => SimpleDomainRequestBuilder<DomainRequestName, DF>;
   fetchDomain: (req: SimpleDomainRequest<DomainRequestName, DF>) => Promise<DomainResult>;
}

export interface Factory<Role extends string, DomainRequestName extends string> {
   getAllRolesRequestBuilders: () => DomainBuildersByRole<
      Role,
      DomainRequestName,
      SimpleDomainRequestBuilder<DomainRequestName, any>
   >;
   getRoleDomainRequestBuilder: (role: Role) => SimpleDomainRequestBuilder<DomainRequestName, any>;
   fetchDomain: (req: SimpleDomainRequest<DomainRequestName, any>) => Promise<DomainResult>;
   initRolesBuildersWithExpandables: (allbuilders: AllBuilders<Role, DomainRequestName>) => void;
   dbTable: SimpleDatabaseTable<DomainRequestName, any, any>;
}

export function getFactoryForSimple<R extends string, DRN extends string, F extends DomainFields, TF extends string>(
   builder: {
      [Property in R]: SimpleDomainRequestBuilder<DRN, any>;
   },
   dbTable: SimpleDatabaseTable<DRN, F, TF>,
): Factory<R, DRN> {
   return {
      getAllRolesRequestBuilders: () => builder,
      getRoleDomainRequestBuilder: (role: R) => builder[role],
      initRolesBuildersWithExpandables: (allBuilders: AllBuilders<R, DRN>) => {},
      fetchDomain: async (req: any) => dbTable.fetch(req),
      dbTable,
   };
}

export function getFactoryForExtended<
   R extends string,
   DRN extends string,
   F extends DomainFields,
   E extends DomainFields,
   TF extends string,
>(
   builder: {
      [Property in R]: DomainWithExtendedRequestBuilder<DRN, any, any>;
   },
   dbTable: ExtendableDatabaseTable<DRN, F, E, TF>,
): Factory<R, DRN> {
   return {
      getAllRolesRequestBuilders: () => builder,
      getRoleDomainRequestBuilder: (role: R) => builder[role],
      initRolesBuildersWithExpandables: (allBuilders: AllBuilders<R, DRN>) => {},
      fetchDomain: async (req: any) => dbTable.fetch(req),
      dbTable,
   };
}

export function getFactoryForExpandables<
   R extends string,
   DRN extends string,
   F extends DomainFields,
   E extends DomainExpandables,
   TF extends string,
>(
   builder: DomainBuildersByRole<R, DRN, DomainWithExpandablesRequestBuilder<DRN, any, any>>,
   dbTable: SimpleDatabaseTable<DRN, F, TF>,
   domainRequestToInit: DRN,
   expandables: Array<ExpandableName<DRN, E>>,
): Factory<R, DRN> {
   return {
      getAllRolesRequestBuilders: () => builder,
      getRoleDomainRequestBuilder: (role: R) => builder[role],
      initRolesBuildersWithExpandables: (allBuilders: AllBuilders<R, DRN>) =>
         initAllRolesDomainRequestBuilders(allBuilders, domainRequestToInit, expandables),
      fetchDomain: async (req) => dbTable.fetch(req as any),
      dbTable,
   };
}

export function getFactoryForExtendedAndExpandables<
   R extends string,
   DRN extends string,
   F extends DomainFields,
   Exp extends DomainExpandables,
   TF extends string,
>(
   builder: DomainBuildersByRole<R, DRN, DomainWithExtendedAndExpandablesRequestBuilder<DRN, any, any, any>>,
   dbTable: SimpleDatabaseTable<DRN, F, TF>,
   domainRequestToInit: DRN,
   expandables: Array<ExpandableName<DRN, Exp>>,
): Factory<R, DRN> {
   return {
      getAllRolesRequestBuilders: () => builder,
      getRoleDomainRequestBuilder: (role: R) => builder[role],
      initRolesBuildersWithExpandables: (allBuilders: AllBuilders<R, DRN>) =>
         initAllRolesDomainRequestBuilders(allBuilders, domainRequestToInit, expandables),
      fetchDomain: async (req) => dbTable.fetch(req as any),
      dbTable,
   };
}

export type ExpandableName<DomainRequestName extends string, Expandables extends DomainExpandables> =
   | DomainRequestName
   | { globalContext: DomainRequestName; currentContext: Extract<keyof Expandables, string> };

function initAllRolesDomainRequestBuilders<
   DomainRequestName extends string,
   Role extends string,
   Expandables extends DomainExpandables,
>(
   builders: AllBuilders<Role, DomainRequestName>,
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
            current = k.currentContext;
         }
         ret[current] = builders[global as DomainRequestName][keyRole];
      }
      const reqBuilder = requestBuilderToInit[keyRole] as DomainWithExpandablesRequestBuilder<
         DomainRequestName,
         any,
         any
      >;
      if (reqBuilder.setExpandables === undefined) {
         throw new Error(
            `Configuration error: for role ${keyRole} of domain request ${domainRequestToInit}, request builder must be of type DomainWithExpandablesRequestBuilder`,
         );
      }
      reqBuilder.setExpandables(ret);
   }
}

type DomainBuildersByRole<
   Role extends string,
   Name extends string,
   RequestBuilder extends SimpleDomainRequestBuilder<Name, any>,
> = {
   [Property in Role]: RequestBuilder;
};

type AllBuilders<Role extends string, Name extends string> = {
   [Property in Name]: DomainBuildersByRole<Role, Name, SimpleDomainRequestBuilder<Name, any>>;
};
