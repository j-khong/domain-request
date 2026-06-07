/**
 * Central configuration for role-based permissions
 * 
 * This is the single source of truth for what each role can:
 * - See (fields)
 * - Filter on (filterable fields)
 * - Default filters (when no filter specified)
 * 
 * Benefits:
 * - Easy audit: see exactly what role X can access
 * - Adding new field: update only here
 * - Type-safe per role
 * - Clear constraints for new developers
 */

export interface FieldRestriction {
   /** Which values can this field have for this role */
   authorized?: unknown[];
   /** Is this field required to be filtered? */
   required?: boolean;
   /** Should this field be hidden from this role? */
   hidden?: boolean;
   /** Default value if not specified */
   default?: unknown;
}

export interface RolePermissionSpec<T extends string> {
   /** Which fields this role can see/query. Empty array = no access to domain */
   fields: T[];
   /** Which fields can be used for filtering */
   filterableFields?: T[];
   /** Restrictions on specific fields (authorized values, requirements, etc) */
   fieldRestrictions?: Partial<Record<T, FieldRestriction>>;
}

export interface RolePermissionsConfig<R extends string, T extends string> {
   roles: Partial<Record<R, RolePermissionSpec<T>>>;
}

/**
 * Builder to create RolePermissionsConfig with fluent API
 */
export class RolePermissionsBuilder<R extends string = string, T extends string = string> {
   private config: RolePermissionsConfig<R, T> = { roles: {} };

   defineRole(role: R): RoleSpecBuilder<R, T> {
      return new RoleSpecBuilder<R, T>(this, role);
   }

   build(): RolePermissionsConfig<R, T> {
      return this.config;
   }

   setRoleSpec(role: R, spec: RolePermissionSpec<T>): this {
      this.config.roles[role] = spec;
      return this;
   }
}

/**
 * Fluent builder for a single role specification
 */
export class RoleSpecBuilder<R extends string, T extends string> {
   private spec: RolePermissionSpec<T> = { fields: [] };

   constructor(
      private parent: RolePermissionsBuilder<R, T>,
      private role: R,
   ) {}

   /**
    * Grant access to these fields (complete list)
    */
   withFields(...fields: T[]): this {
      this.spec.fields = fields;
      return this;
   }

   /**
    * Grant access to all fields (admin role)
    */
   withAllFields(): this {
      this.spec.fields = [...([].constructor.name as any)] as T[]; // Placeholder for all
      return this;
   }

   /**
    * Specify which fields can be used for filtering
    */
   canFilterOn(...fields: T[]): this {
      this.spec.filterableFields = fields;
      return this;
   }

   /**
    * Add restrictions to a field (authorized values, requirements)
    */
   restrictField(field: T, restriction: FieldRestriction): this {
      if (!this.spec.fieldRestrictions) {
         this.spec.fieldRestrictions = {};
      }
      this.spec.fieldRestrictions[field] = restriction;
      return this;
   }

   /**
    * Mark field as required in filters
    */
   requireFieldInFilter(field: T): this {
      return this.restrictField(field, { required: true });
   }

   /**
    * Hide field from this role
    */
   hideField(field: T): this {
      return this.restrictField(field, { hidden: true });
   }

   /**
    * Limit field to specific authorized values
    */
   limitFieldValues(field: T, values: unknown[]): this {
      return this.restrictField(field, { authorized: values });
   }

   /**
    * Complete this role and return to parent builder
    */
   and(): RolePermissionsBuilder<R, T> {
      return this.parent.setRoleSpec(this.role, this.spec);
   }
}

/**
 * Helper to create role permissions configuration
 */
export function createRolePermissions<R extends string, T extends string>(): RolePermissionsBuilder<R, T> {
   return new RolePermissionsBuilder<R, T>();
}

/**
 * Check if a role has permission to access a field
 */
export function canRoleAccessField<R extends string, T extends string>(
   config: RolePermissionsConfig<R, T>,
   role: R,
   field: T,
): boolean {
   const roleSpec = config.roles[role];
   if (!roleSpec) return false;

   // Check if field in authorized fields
   if (!roleSpec.fields.includes(field)) return false;

   // Check if field is hidden
   const restriction = roleSpec.fieldRestrictions?.[field];
   if (restriction?.hidden) return false;

   return true;
}

/**
 * Check if a role can filter on a field
 */
export function canRoleFilterField<R extends string, T extends string>(
   config: RolePermissionsConfig<R, T>,
   role: R,
   field: T,
): boolean {
   const roleSpec = config.roles[role];
   if (!roleSpec) return false;

   // If filterableFields not specified, can filter on any accessible field
   if (!roleSpec.filterableFields) {
      return canRoleAccessField(config, role, field);
   }

   return roleSpec.filterableFields.includes(field);
}

/**
 * Get field restrictions for a role
 */
export function getRoleFieldRestriction<R extends string, T extends string>(
   config: RolePermissionsConfig<R, T>,
   role: R,
   field: T,
): FieldRestriction | undefined {
   const roleSpec = config.roles[role];
   if (!roleSpec) return undefined;
   return roleSpec.fieldRestrictions?.[field];
}
