import { FieldsSetup } from './object.ts';

/**
 * FieldsSetupBuilder - Makes it easy to create and modify FieldsSetup
 *
 * Before (manual, error-prone):
 * ```
 * const setup = generateFieldsSetup();
 * setup.status = new FieldConfiguration(...);
 * setup.name = new FieldConfiguration(...);
 * ```
 *
 * After (builder, chainable):
 * ```
 * new FieldsSetupBuilder(generateFieldsSetup())
 *    .override('status', config => config.addAuthorized(['open', 'closed']))
 *    .override('name', config => config.required(true))
 *    .build()
 * ```
 */
export class FieldsSetupBuilder<T> {
   private setup: FieldsSetup<T>;

   constructor(initialSetup: FieldsSetup<T>) {
      this.setup = { ...initialSetup };
   }

   /**
    * Override a field's configuration
    */
   override<K extends keyof T>(field: K, config: FieldsSetup<T>[K]): this {
      this.setup[field] = config;
      return this;
   }

   /**
    * Override multiple fields with same configuration
    */
   overrideMultiple<K extends keyof T>(fields: Array<K>, config: FieldsSetup<T>[K]): this {
      for (const field of fields) {
         this.setup[field] = config;
      }
      return this;
   }

   /**
    * Modify a field's configuration using a callback
    */
   modify<K extends keyof T>(field: K, modifier: (current: FieldsSetup<T>[K]) => FieldsSetup<T>[K]): this {
      const current = this.setup[field];
      this.setup[field] = modifier(current);
      return this;
   }

   /**
    * Remove a field from the setup
    */
   exclude<K extends keyof T>(...fields: K[]): this {
      for (const field of fields) {
         delete (this.setup as any)[field as any];
      }
      return this;
   }

   /**
    * Keep only these fields (remove all others)
    */
   onlyFields(...fields: Array<keyof T>): this {
      const newSetup = {} as FieldsSetup<T>;
      for (const field of fields) {
         if (field in this.setup) {
            newSetup[field] = this.setup[field];
         }
      }
      this.setup = newSetup;
      return this;
   }

   /**
    * Clone the builder (for branching builds)
    */
   clone(): FieldsSetupBuilder<T> {
      return new FieldsSetupBuilder({ ...this.setup });
   }

   /**
    * Build and return the final FieldsSetup
    */
   build(): FieldsSetup<T> {
      return this.setup;
   }
}

/**
 * Helper to create a FieldsSetupBuilder
 */
export function createFieldsSetupBuilder<T>(initialSetup: FieldsSetup<T>): FieldsSetupBuilder<T> {
   return new FieldsSetupBuilder(initialSetup);
}
