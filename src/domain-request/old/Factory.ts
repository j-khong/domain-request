/**
 * DEPRECATED: Old Factory API
 *
 * This file contains the legacy API for building domain request factories.
 * Use the new fluent API (DomainRoleBuilder) instead.
 *
 * @deprecated Use DomainRoleBuilder from ../roles/DomainRoleBuilder.ts
 */

import { DomainConfig, FieldsSetup, ObjectFieldConfiguration } from '../field-configuration/index.ts';
import { DomainRequestBuilder } from '../builder.ts';

export type DomainRequestByRole<R extends string, DRN extends string, F> = {
   [Property in R]: {
      buildRequestBuilder: () => DomainRequestBuilder<DRN, F>;
      /**
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
      authorizedFields?: Array<keyof Fields>;
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
 * @deprecated Use DomainRoleBuilder instead
 * every missing role in rolesSpecifics will be provided by an unauthorized one
 */
export function buildDomainRequestBuilderByRole<R extends string, DRN extends string, F>(v: {
   domainRequestName: DRN;
   generateFieldsSetup: () => FieldsSetup<F>;
   naturalKey?: Array<Extract<keyof F, string>>;
   rolesList: R[];
   initDomainConfig?: (dc: DomainConfig<DRN, F>, role: R, toIgnore: string[]) => void;
   rolesSpecifics: Partial<{
      [Property in R]: {
         modifyFieldsSetup?: (setup: FieldsSetup<F>) => void;
         authorizedFields?: Array<keyof F>;
      };
   }>;
}) {
   const ret = {} as DomainRequestByRole<R, DRN, F>;
   const { domainRequestName, rolesList, naturalKey, initDomainConfig, rolesSpecifics } = v;
   for (const role of rolesList) {
      const roleSpecifics = rolesSpecifics[role];
      if (roleSpecifics === undefined) {
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

/**
 * @deprecated This is an internal implementation detail
 */
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
