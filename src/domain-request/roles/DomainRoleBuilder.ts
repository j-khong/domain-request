import { DomainRequestBuilder } from '../builder.ts';
import { FieldsSetup, DomainConfig, ObjectFieldConfiguration } from '../field-configuration/index.ts';
import { RolePermissionsConfig } from './RolePermissions.ts';

/**
 * Fluent builder for defining domains with role-based configurations
 *
 * This replaces the complex nested object pattern of buildDomainRequestBuilderByRole
 * with a clearer, chainable API
 *
 * Before (nested, hard to understand):
 * ```
 * buildDomainRequestBuilderByRole({
 *    rolesSpecifics: {
 *       admin: { authorizedFields: [...] },
 *       student: { modifyFieldsSetup(...), authorizedFields: [...] }
 *    }
 * })
 * ```
 *
 * After (fluent, self-documented):
 * ```
 * new DomainRoleBuilder(...)
 *    .role('admin').withAllFields().and()
 *    .role('student').withFields(['id', 'name']).restrictField('status', {...}).and()
 *    .build()
 * ```
 */
export class DomainRoleBuilder<DRN extends string, Fields, Role extends string> {
   private roleConfigs: Map<Role, RoleConfig<DRN, Fields, Role>> = new Map();
   private dependencyInitializer?: (dc: DomainConfig<DRN, Fields>, role: Role, toIgnore: string[]) => void;

   constructor(
      private domainRequestName: DRN,
      private generateFieldsSetup: () => FieldsSetup<Fields>,
      private rolesList: Role[],
      private naturalKey: Array<Extract<keyof Fields, string>> = ['id' as Extract<keyof Fields, string>],
   ) {}

   /**
    * Register an initializer for domain dependencies (e.g., linked domains)
    */
   withDependencyInitializer(fn: (dc: DomainConfig<DRN, Fields>, role: Role, toIgnore: string[]) => void): this {
      this.dependencyInitializer = fn;
      return this;
   }

   /**
    * Start defining permissions for a role
    */
   role(role: Role): RoleConfigBuilder<DRN, Fields, Role> {
      return new RoleConfigBuilder<DRN, Fields, Role>(this, role);
   }

   /**
    * Set configuration for all undefined roles
    */
   defaultRoleTo(config: RoleConfig<DRN, Fields, Role>): this {
      for (const role of this.rolesList) {
         if (!this.roleConfigs.has(role)) {
            this.roleConfigs.set(role, config);
         }
      }
      return this;
   }

   /**
    * Set default: all roles have no access (unauthorized)
    */
   defaultRolesToUnauthorized(): this {
      return this.defaultRoleTo({ authorizedFields: [] });
   }

   /**
    * Set a role configuration internally (called by RoleConfigBuilder)
    */
   setRoleConfig(role: Role, config: RoleConfig<DRN, Fields, Role>): this {
      this.roleConfigs.set(role, config);
      return this;
   }

   /**
    * Build the final role configuration
    */
   build(): {
      [Property in Role]: {
         buildRequestBuilder: () => DomainRequestBuilder<DRN, Fields>;
         createDomainConfig: (toIgnore?: string[]) => DomainConfig<DRN, Fields>;
      };
   } {
      const ret = {} as any;

      for (const role of this.rolesList) {
         const roleConfig = this.roleConfigs.get(role) || { authorizedFields: [] };

         ret[role] = {
            buildRequestBuilder: () => {
               return new DomainRequestBuilder<DRN, Fields>(
                  this.domainRequestName,
                  this.naturalKey,
                  this.createDomainConfig(roleConfig, []),
               );
            },
            createDomainConfig: (toIgnore: string[] = []) => {
               return this.createDomainConfig(roleConfig, toIgnore);
            },
         };
      }

      return ret;
   }

   /**
    * Internal method to create domain config for a role
    */
   private createDomainConfig(
      roleConfig: RoleConfig<DRN, Fields, Role>,
      toIgnore: string[],
   ): DomainConfig<DRN, Fields> {
      let fieldsSetup = this.generateFieldsSetup();

      // Apply field-level modifications if specified
      if (roleConfig.modifyFieldsSetup) {
         roleConfig.modifyFieldsSetup(fieldsSetup);
      }

      // Apply authorized fields filter
      let fieldsToUse = fieldsSetup;
      if (roleConfig.authorizedFields !== undefined) {
         fieldsToUse = {} as FieldsSetup<Fields>;
         for (const key in fieldsSetup) {
            if (roleConfig.authorizedFields.includes(key as any)) {
               fieldsToUse[key] = fieldsSetup[key];
            }
         }
      }

      const conf: DomainConfig<DRN, Fields> = {
         name: this.domainRequestName,
         fields: new ObjectFieldConfiguration<Fields>(fieldsToUse),
      };

      // Call dependency initializer if provided
      if (this.dependencyInitializer !== undefined) {
         // Get the role from roleConfigs - we need it from the current context
         let currentRole: Role | undefined;
         for (const [role, config] of this.roleConfigs) {
            if (config === roleConfig) {
               currentRole = role;
               break;
            }
         }
         if (currentRole !== undefined) {
            this.dependencyInitializer(conf, currentRole, toIgnore);
         }
      }

      return conf;
   }
}

/**
 * Configuration for a single role
 */
export interface RoleConfig<DRN extends string, Fields, Role extends string> {
   /** Fields this role can access. Undefined = all accessible */
   authorizedFields?: Array<keyof Fields>;
   /** Optional callback to modify fields setup per role */
   modifyFieldsSetup?: (setup: FieldsSetup<Fields>) => void;
}

/**
 * Builder for a single role's configuration
 */
export class RoleConfigBuilder<DRN extends string, Fields, Role extends string> {
   private config: RoleConfig<DRN, Fields, Role> = {};

   constructor(
      private parent: DomainRoleBuilder<DRN, Fields, Role>,
      private role: Role,
   ) {}

   /**
    * Give this role access to all fields
    */
   withAllFields(): this {
      this.config.authorizedFields = undefined; // undefined = all fields
      return this;
   }

   /**
    * Restrict this role to specific fields
    */
   withFields(...fields: Array<keyof Fields>): this {
      this.config.authorizedFields = fields;
      return this;
   }

   /**
    * Deny all field access to this role
    */
   withNoFields(): this {
      this.config.authorizedFields = [];
      return this;
   }

   /**
    * Modify the fields setup for this role (e.g., restrict enum values)
    */
   modifyFields(fn: (setup: FieldsSetup<Fields>) => void): this {
      this.config.modifyFieldsSetup = fn;
      return this;
   }

   /**
    * Complete this role configuration and return to parent builder
    */
   and(): DomainRoleBuilder<DRN, Fields, Role> {
      return this.parent.setRoleConfig(this.role, this.config);
   }

   /**
    * Shortcut: complete this role and start next role config
    */
   thenRole(role: Role): RoleConfigBuilder<DRN, Fields, Role> {
      return this.and().role(role);
   }
}

/**
 * Helper to create a domain role builder
 */
export function createDomainRoleBuilder<DRN extends string, F, R extends string>(
   domainRequestName: DRN,
   generateFieldsSetup: () => FieldsSetup<F>,
   rolesList: R[],
   naturalKey?: Array<Extract<keyof F, string>>,
): DomainRoleBuilder<DRN, F, R> {
   return new DomainRoleBuilder(domainRequestName, generateFieldsSetup, rolesList, naturalKey);
}
