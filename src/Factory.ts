import { DomainResult } from './persistence';
import { SelectMethod, DatabaseTable, SimpleDatabaseTable, ExtendableDatabaseTable } from './persistence/database';
import {
   DomainExpandables,
   DomainFields,
   SimpleDomainRequest,
   DomainRequestBuilder,
   SimpleDomainRequestBuilder,
   DomainWithExtendedRequestBuilder,
} from './DomainRequest';

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
   fetchData: (req: SimpleDomainRequest<DomainRequestName, any>) => Promise<DomainResult>;
}

export interface Factory<Role extends string, DomainRequestName extends string> {
   getAllRolesRequestBuilders: () => DomainBuildersByRole<
      Role,
      DomainRequestName,
      DomainRequestBuilder<DomainRequestName, any, any>
   >;
   getRoleDomainRequestBuilder: (role: Role) => DomainRequestBuilder<DomainRequestName, any, any>;
   fetchData: (req: SimpleDomainRequest<DomainRequestName, any>) => Promise<DomainResult>;
   initRolesBuilders: (allbuilders: {
      [Property in DomainRequestName]: DomainBuildersByRole<
         Role,
         DomainRequestName,
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
   builder: DomainBuildersByRole<R, DRN, DomainRequestBuilder<DRN, any, any>>,
   dbTable: DatabaseTable<DRN, F, E, TF>,
   domainRequestToInit: DRN,
   expandables: Array<ExpandableName<DRN, E>>,
): Factory<R, DRN> {
   return {
      getAllRolesRequestBuilders: () => builder,
      getRoleDomainRequestBuilder: (role: R) => builder[role],
      initRolesBuilders: (allBuilders: {
         [Property in DRN]: DomainBuildersByRole<R, DRN, DomainRequestBuilder<DRN, any, any>>;
      }) => initAllRolesDomainRequestBuilders(allBuilders, domainRequestToInit, expandables),
      fetchData: async (req) => dbTable.fetch(req as any),
      dbTable,
   };
}

export function getFactoryForSimple<R extends string, DRN extends string, F extends DomainFields, TF extends string>(
   builder: {
      [Property in R]: SimpleDomainRequestBuilder<DRN, F>;
   },
   dbTable: SimpleDatabaseTable<DRN, F, TF>,
): any {
   // Factory<R, DRN> {
   return {
      getAllRolesRequestBuilders: () => builder,
      getRoleDomainRequestBuilder: (role: R) => builder[role],
      initRolesBuilders /* with expandbles */: (allBuilders: {
         [Property in DRN]: DomainBuildersByRole<R, DRN, DomainRequestBuilder<DRN, any, any>>;
      }) => {},
      fetchData: async (req: any) => dbTable.fetch(req),
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
      [Property in R]: DomainWithExtendedRequestBuilder<DRN, F, E>;
   },
   dbTable: ExtendableDatabaseTable<DRN, F, E, TF>,
): any {
   // Factory<R, DRN> {
   return {
      getAllRolesRequestBuilders: () => builder,
      getRoleDomainRequestBuilder: (role: R) => builder[role],
      initRolesBuilders /* with expandbles */: (allBuilders: {
         [Property in DRN]: DomainBuildersByRole<R, DRN, DomainRequestBuilder<DRN, any, any>>;
      }) => {},
      fetchData: async (req: any) => dbTable.fetch(req),
      dbTable,
   };
}

export type ExpandableName<DomainRequestName extends string, Expandables extends DomainExpandables> =
   | DomainRequestName
   | { globalContext: DomainRequestName; currentContext: keyof Expandables };

function initAllRolesDomainRequestBuilders<
   DomainRequestName extends string,
   Role extends string,
   Expandables extends DomainExpandables,
>(
   builders: {
      [Property in DomainRequestName]: DomainBuildersByRole<
         Role,
         DomainRequestName,
         DomainRequestBuilder<DomainRequestName, any, any>
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

type DomainBuildersByRole<
   Role extends string,
   Name extends string,
   RequestBuilder extends DomainRequestBuilder<Name, any, any>,
> = {
   [Property in Role]: RequestBuilder;
};
