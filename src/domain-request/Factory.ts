import { DomainResult, DomainRequestBuilder, DomainRequest } from './builder.ts';
import { Persistence } from '../persistence/index.ts';
import { DomainConfig, FieldsSetup, ObjectFieldConfiguration } from './field-configuration/index.ts';

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

class ConfigBuilderForRole<DomainRequestName extends string, Fields, Role extends string> {
   private readonly domainRequestName: DomainRequestName;
   private readonly naturalKey: Array<Extract<keyof Fields, string>>;
   private readonly generateFieldsSetup: () => FieldsSetup<Fields>;
   private readonly authorizedFields?: Array<keyof Fields>;
   private readonly dependencies?: {
      initDomainConfig: (dc: DomainConfig<DomainRequestName, Fields>, role: Role, toIgnore: string[]) => void;
      role: Role;
   };

   /**
    * @param values.authorizedFields : explicitly pass an empty array if you want the role to NOT GET ANY DATA FROM THIS DOMAIN
    * @param values.naturalKey : default value is ['id']
    */
   constructor(values: {
      domainRequestName: DomainRequestName;
      generateFieldsSetup: () => FieldsSetup<Fields>;
      dependencies?: {
         initDomainConfig: (dc: DomainConfig<DomainRequestName, Fields>, role: Role, toIgnore: string[]) => void;
         role: Role;
      };
      authorizedFields?: Array<keyof Fields>; // explicitly pass an empty array if you want the role to NOT GET ANY DATA FROM THIS DOMAIN
      naturalKey?: Array<Extract<keyof Fields, string>>;
   }) {
      this.domainRequestName = values.domainRequestName;
      this.generateFieldsSetup = values.generateFieldsSetup;
      this.dependencies = values.dependencies;
      this.authorizedFields = values.authorizedFields;
      this.naturalKey = values.naturalKey ?? ['id' as Extract<keyof Fields, string>];
   }

   buildRequestBuilder(): DomainRequestBuilder<DomainRequestName, Fields> {
      return new DomainRequestBuilder<DomainRequestName, Fields>(
         this.domainRequestName,
         this.naturalKey,
         this.createDomainConfig(),
      );
   }
   createDomainConfig(toIgnore: string[] = []): DomainConfig<DomainRequestName, Fields> {
      const fieldMapping = this.generateFieldsSetup();
      const conf = createDomainConfig(this.domainRequestName, fieldMapping, this.authorizedFields);

      if (this.dependencies !== undefined) {
         this.dependencies.initDomainConfig(conf, this.dependencies.role, toIgnore);
      }
      return conf;
   }
}

/**
 * every missing role in rolesSpecifics will be provided by an unauthorized one
 * @returns
 */
export function buildDomainRequestBuilderByRole<R extends string, DRN extends string, F>(v: {
   domainRequestName: DRN;
   generateFieldsSetup: () => FieldsSetup<F>;
   naturalKey?: Array<Extract<keyof F, string>>;

   rolesList: R[];

   /**
    *
    * @param toIgnore domain names to ignore, when 2 domains are mutually imported
    */
   initDomainConfig?: (dc: DomainConfig<DRN, F>, role: R, toIgnore: string[]) => void;

   rolesSpecifics: Partial<{
      [Property in R]: {
         modifyFieldsSetup?: (setup: FieldsSetup<F>) => void;
         authorizedFields?: Array<keyof F>; // explicitly pass an empty array if you want the role to NOT GET ANY DATA FROM THIS DOMAIN
      };
   }>;
}) {
   const ret = {} as DomainRequestByRole<R, DRN, F>;
   const { domainRequestName, rolesList, naturalKey, initDomainConfig, rolesSpecifics } = v;
   for (const role of rolesList) {
      const roleSpecifics = rolesSpecifics[role];
      if (roleSpecifics === undefined) {
         // this role is not defined so we create an unauthorized role
         const generateFieldsSetup = v.generateFieldsSetup;
         ret[role] = new ConfigBuilderForRole<DRN, F, R>({
            domainRequestName,
            generateFieldsSetup,
            naturalKey,
            authorizedFields: [],
         });
      } else {
         const dependencies =
            initDomainConfig === undefined
               ? undefined
               : {
                    initDomainConfig,
                    role,
                 };
         const modifyFieldsSetup = roleSpecifics.modifyFieldsSetup;
         const generateFieldsSetup =
            modifyFieldsSetup === undefined
               ? v.generateFieldsSetup
               : () => {
                    const setup = v.generateFieldsSetup();
                    modifyFieldsSetup(setup);
                    return setup;
                 };

         ret[role] = new ConfigBuilderForRole<DRN, F, R>({
            domainRequestName,
            generateFieldsSetup,
            naturalKey,
            authorizedFields: roleSpecifics.authorizedFields,
            dependencies,
         });
      }
   }
   return ret;
}

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
