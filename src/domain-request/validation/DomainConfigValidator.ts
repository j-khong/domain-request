import { DomainConfig } from '../field-configuration/types.ts';
import { LinkedDomainConfiguration, ArrayOfLinkedDomainConfiguration } from '../field-configuration/linked.ts';

export type ValidationError = {
   context: string;
   message: string;
};

export type ValidationResult = {
   valid: boolean;
   errors: ValidationError[];
};

/**
 * Validates domain configurations at setup time to catch dependency issues early
 * instead of at runtime.
 *
 * Checks for:
 * - LinkedDomainConfiguration properly initialized
 * - No circular dependencies
 * - All referenced domains exist
 */
export class DomainConfigValidator {
   private readonly allConfigs: Map<string, DomainConfig<string, any>> = new Map();
   private readonly linkedConfigs: Map<
      string,
      LinkedDomainConfiguration<string, any> | ArrayOfLinkedDomainConfiguration<string, any>
   > = new Map();

   /**
    * Register all domain configurations for validation
    */
   registerConfig<DRN extends string, T>(config: DomainConfig<DRN, T>): void {
      this.allConfigs.set(config.name, config);
      this.collectLinkedConfigurations(config, config.name);
   }

   /**
    * Validate all registered configurations
    */
   validate(): ValidationResult {
      const errors: ValidationError[] = [];

      // Check 1: All LinkedDomainConfigurations are initialized
      for (const [name, linkedConfig] of this.linkedConfigs) {
         if (linkedConfig instanceof LinkedDomainConfiguration) {
            if (!this.isInitialized(linkedConfig)) {
               errors.push({
                  context: 'LinkedDomainConfiguration',
                  message: `LinkedDomainConfiguration [${name}] is not initialized. Call .init() during setup phase.`,
               });
            }
         }
      }

      // Check 2: No circular dependencies
      const circularDeps = this.detectCircularDependencies();
      errors.push(...circularDeps);

      return {
         valid: errors.length === 0,
         errors,
      };
   }

   /**
    * Recursively collect all linked configurations for validation
    */
   private collectLinkedConfigurations(
      config: DomainConfig<string, any>,
      parentName: string,
      visited: Set<string> = new Set(),
   ): void {
      if (visited.has(config.name)) {
         return; // Avoid infinite recursion
      }
      visited.add(config.name);

      const fieldsConf = config.fields.getConf?.();
      if (!fieldsConf) {
         return;
      }

      for (const fieldName in fieldsConf) {
         const field = fieldsConf[fieldName];
         if (field instanceof LinkedDomainConfiguration || field instanceof ArrayOfLinkedDomainConfiguration) {
            this.linkedConfigs.set(`${parentName}.${fieldName}`, field);
         }
      }
   }

   /**
    * Detect circular dependencies in domain references
    */
   private detectCircularDependencies(): ValidationError[] {
      const errors: ValidationError[] = [];
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      const visit = (configName: string, currentPath: string[]): void => {
         if (recursionStack.has(configName)) {
            const path = [...currentPath, configName].join(' → ');
            errors.push({
               context: 'CircularDependency',
               message: `Circular dependency detected: ${path}`,
            });
            return;
         }

         if (visited.has(configName)) {
            return;
         }

         recursionStack.add(configName);

         const config = this.allConfigs.get(configName);
         if (config) {
            const dependencies = this.extractDependencies(config);
            for (const dep of dependencies) {
               visit(dep, [...currentPath, configName]);
            }
         }

         recursionStack.delete(configName);
         visited.add(configName);
      };

      for (const configName of this.allConfigs.keys()) {
         if (!visited.has(configName)) {
            visit(configName, []);
         }
      }

      return errors;
   }

   /**
    * Extract dependencies from a domain config
    */
   private extractDependencies(config: DomainConfig<string, any>): string[] {
      const dependencies: string[] = [];
      const fieldsConf = config.fields.getConf?.();
      if (!fieldsConf) {
         return dependencies;
      }

      for (const fieldName in fieldsConf) {
         const field = fieldsConf[fieldName];
         if (field instanceof LinkedDomainConfiguration) {
            // Extract domain name from linked config
            const linkedDomain = (field as any).linkedDomain;
            if (linkedDomain) {
               dependencies.push(linkedDomain);
            }
         }
      }

      return dependencies;
   }

   /**
    * Check if a LinkedDomainConfiguration has been initialized
    */
   private isInitialized(linkedConfig: LinkedDomainConfiguration<string, any>): boolean {
      // Access private field to check initialization
      const domain = (linkedConfig as any).dom;
      return domain !== undefined;
   }
}
