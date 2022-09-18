import { isSomethingLike } from '../type-checkers.ts';
import { InputErrors, NaturalKey, Tree, BoolTree, RequestableFields } from '../types.ts';

import { DomainConfig, FiltersTree } from './field-configuration/index.ts';
import { FieldsSetup, ObjectFieldConfiguration, Options } from './field-configuration/object.ts';

export interface DomainResult {
   domainName: string;
   results: any[];
   report: Report;
   total: number;
   errors: string[];
}

export interface Report {
   requests: Array<RequestReport>;
}

export interface RequestReport {
   request: string;
   timeInMs: number;
   error?: string;
}

export interface DomainRequest<Name extends string, T> {
   name: Name;
   naturalKey: NaturalKey<Extract<keyof T, string>>;
   fields: RequestableFields<T>;
   filters: FiltersTree<T>;
   // protected readonly filters: FilteringFields<Fields>,
   options: Options<Extract<keyof T, string>>;
}

export class DomainRequestBuilder<Name extends string, T> {
   constructor(
      protected readonly name: Name,
      protected readonly naturalKey: NaturalKey<Extract<keyof T, string>>,
      protected readonly domainConfig: DomainConfig<Name, T>,
      private readonly MAX_LIMIT = 5000,
   ) {
      if (naturalKey.length === 0) {
         throw new Error(`Configuration error, natural keys array must not be empty for [${name}]`);
      }
   }

   getName(): Name {
      return this.name;
   }

   build(input: unknown): {
      request: DomainRequest<Name, T>;
      errors: InputErrors;
   } {
      const { fields, filters, options } = this.splitValues(input);

      const sanitizedFields = this.domainConfig.fields.sanitizeFields(fields);
      const sanitizedFilters = this.domainConfig.fields.sanitizeFilters(filters);
      const sanitizedOptions = this.domainConfig.fields.sanitizeOptions(options, this.MAX_LIMIT);

      return {
         request: {
            name: this.name,
            naturalKey: this.naturalKey,
            fields: sanitizedFields.fields,
            filters: sanitizedFilters.filters,
            options: sanitizedOptions.options,
         },
         errors: [...sanitizedFields.errors, ...sanitizedFilters.errors, ...sanitizedOptions.errors],
      };
   }

   protected splitValues(input: unknown): {
      fields: BoolTree;
      filters: Tree;
      options: Tree;
   } {
      let fields: BoolTree = {};
      let filters: Tree = {};
      let options: Tree = {};
      if (input !== undefined) {
         if (isSomethingLike<{ fields: BoolTree }>(input) && input.fields !== undefined) {
            fields = input.fields as BoolTree;
         }
         if (isSomethingLike<{ filters: Tree }>(input) && input.filters !== undefined) {
            filters = input.filters as Tree;
         }
         if (isSomethingLike<{ options: Tree }>(input) && input.options !== undefined) {
            options = input.options as Tree;
         }
      }
      return {
         fields,
         filters,
         options,
      };
   }
}

// export class SimpleDomainRequest<Name extends string, Fields extends DomainFields> {
//    constructor(
//       protected readonly name: Name,
//       protected readonly naturalKey: NaturalKey<Extract<keyof Fields, string>>,
//       protected readonly fields: RequestableFields<Fields>,
//       protected readonly filters: FilteringFields<Fields>,
//       protected readonly options: Options<Fields>,
//       protected readonly fieldsToCompute: Map<Extract<keyof Fields, string>, any>,
//    ) {}

//    getName(): Name {
//       return this.name;
//    }

//    getOptions(): Options<Fields> {
//       return this.options;
//    }

//    getFieldsNames(): Array<keyof RequestableFields<Fields>> {
//       const ret: Array<keyof RequestableFields<Fields>> = [];
//       for (const field in this.fields) {
//          if (this.fields[field] === true) {
//             ret.push(field);
//          }
//       }
//       return ret;
//    }

//    getFieldsToCompute(): Map<Extract<keyof Fields, string>, any> {
//       return this.fieldsToCompute;
//    }

//    getFields(): RequestableFields<Fields> {
//       return this.fields;
//    }

//    setField(key: keyof RequestableFields<Fields>, value: boolean): void {
//       this.fields[key] = value;
//    }

//    getFilters(): FilteringFields<Fields> {
//       return this.filters;
//    }

//    setFilter(filter: {
//       key: keyof FilteringFields<Fields>;
//       operator: Operator;
//       value: any; //FilteringFields<Fields>[keyof FilteringFields<Fields>];
//    }): void {
//       (this.filters as any)[filter.key] = { and: [{ operator: filter.operator, value: filter.value }] };
//    }

//    getNaturalKey(): NaturalKey<Extract<keyof Fields, string>> {
//       return this.naturalKey;
//    }

//    getId(): Extract<keyof Fields, string> {
//       return this.naturalKey[0];
//    }

//    private selectCount = true;
//    dontSelectCount(): void {
//       this.selectCount = false;
//    }

//    isSelectCount(): boolean {
//       return this.selectCount;
//    }
// }

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
