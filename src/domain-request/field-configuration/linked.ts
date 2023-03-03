import { BoolTree, Tree, InputErrors } from '../types.ts';
import { DomainFieldConfiguration, DomainConfig, FiltersTree, FilterArrayType } from './types.ts';

class CommonLinkedDomainConfiguration<DRN extends string, T> extends DomainFieldConfiguration {
   constructor(private readonly mainDomain: DRN, private readonly linkedDomain: DRN) {
      super();
   }

   private getDomain(): DomainConfig<DRN, T> {
      if (undefined === this.dom) {
         throw new Error(
            `Confguration error, please init LinkedDomainConfiguration [${this.linkedDomain}] used by [${this.mainDomain}]`,
         );
      }
      return this.dom;
   }
   private dom: DomainConfig<DRN, T> | undefined;
   init(i: DomainConfig<DRN, T>): void {
      this.dom = i;
   }

   sanitizeField(
      inputFieldsToSelect: BoolTree,
      fieldName: string,
      toSet: BoolTree,
   ):
      | {
           errors: InputErrors;
        }
      | undefined {
      const snakedFieldname = this.camelToInputStyle(fieldName);
      const val = inputFieldsToSelect[snakedFieldname];
      if (val === undefined) {
         return undefined;
      }

      const res = this.getDomain().fields.sanitizeFields(val as BoolTree);
      if (Object.keys(res.fields).length > 0) {
         toSet[fieldName] = res.fields;
      } else {
         res.errors.push({
            context: 'selected field',
            fieldName: snakedFieldname,
            reason: `incorrect field selection [${snakedFieldname}] of expandable domain [${this.getDomain().name}]`,
         });
      }

      return { errors: res.errors };
   }

   createInputFieldType(fieldName: string): string | undefined {
      const value = this.getDomain().fields.createInputFieldsType();
      if (value === undefined) {
         return undefined;
      }

      return `${this.camelToInputStyle(fieldName)}?:${value};`;
   }

   createInputFilterType(fieldName: string): string | undefined {
      return this.getDomain().fields.createInputFilterType(fieldName);
   }

   sanitizeFilter(
      inputFilters: { [key: string]: unknown },
      fieldName: string, //Extract<keyof T, string>,
      toSet: FiltersTree<unknown>,
      _arrayToPush: 'and' | 'or',
   ):
      | {
           errors: InputErrors;
        }
      | undefined {
      const val = inputFilters[this.camelToInputStyle(fieldName)];
      if (val === undefined) {
         return undefined;
      }

      const res = this.getDomain().fields.sanitizeFilters(val as Tree);

      if (Object.keys(res.filters).length > 0) {
         const toAdd: FilterArrayType<T> = {} as FilterArrayType<T>;
         toAdd[fieldName as Extract<keyof T, string>] = res.filters;
         toSet.and.push(toAdd);
      }

      return { errors: res.errors };
   }

   sanitizeOption(
      inputOptions: { [key: string]: unknown },
      fieldName: string,
      toSet: Tree,
      MAX_LIMIT: number,
   ):
      | {
           errors: InputErrors;
        }
      | undefined {
      const val = inputOptions[this.camelToInputStyle(fieldName)];
      if (val === undefined) {
         return undefined;
      }

      const res = this.getDomain().fields.sanitizeOptions(val as { [key: string]: unknown }, MAX_LIMIT);
      toSet[fieldName as Extract<keyof T, string>] = res.options;

      // // as this is a 1to1 relation, 1 order by applies
      // toSet.orderby = res.options.orderby;

      return { errors: res.errors };
   }
}

export class LinkedDomainConfiguration<DRN extends string, T> extends CommonLinkedDomainConfiguration<DRN, T> {}

export class ArrayOfLinkedDomainConfiguration<DRN extends string, T> extends CommonLinkedDomainConfiguration<DRN, T> {}
