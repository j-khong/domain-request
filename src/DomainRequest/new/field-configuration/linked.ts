import { BoolTree, Tree, InputErrors } from '../../types.ts';
import { FiltersTree, FilterArrayType } from './types.ts';
import { DomainFieldConfiguration, DomainConfig } from './index.ts';

class CommonLinkedDomainConfiguration<DRN extends string, T> extends DomainFieldConfiguration {
   constructor(private readonly mainDomain: string, private readonly linkedDomain: string) {
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

   sanitizeFilter(
      inputFilters: { [key: string]: unknown },
      fieldName: string, //Extract<keyof T, string>,
      toSet: FiltersTree<unknown>,
   ):
      | {
           errors: InputErrors;
        }
      | undefined {
      const val = inputFilters[this.camelToInputStyle(fieldName)];
      if (val === undefined) {
         return undefined;
      }

      // console.log('CommonLinkedDomainConfiguration val:', val);
      const res = this.getDomain().fields.sanitizeFilters(val as Tree);
      if (Object.keys(res.filters).length > 0) {
         const toAdd: FilterArrayType<T> = {} as FilterArrayType<T>;
         toAdd[fieldName as Extract<keyof T, string>] = res.filters;
         toSet.and.push(toAdd);
      }

      return { errors: res.errors };
   }

   // getDefaultValue(dontDoThese: string[]): unknown | undefined {
   //    const ret: any = {};
   //    const domain = this.getDomain();
   //    if (dontDoThese.includes(domain.name)) {
   //       return undefined;
   //    }

   //    const newArr = [...dontDoThese, domain.name];
   //    // TODO FIX THAT
   //    //   for (const k in domain.fields) {
   //    //      const res = domain.fields[k].getDefaultValue(newArr);
   //    //      if (res !== undefined) {
   //    //         ret[k] = res;
   //    //      }
   //    //   }
   //    return ret;
   // }

   // getDefaultRequestableValue(dontDoThese: string[]): RequestableFields<ObjectFieldConfiguration<T>> | undefined {
   //    const ret: any = {};
   //    const domain = this.getDomain();

   //    if (dontDoThese.includes(domain.name)) {
   //       return undefined;
   //    }
   //    const newArr = [...dontDoThese, domain.name];
   //    // TODO FIX THAT
   //    //   for (const k in domain.fields) {
   //    //      const res = domain.fields[k].getDefaultRequestableValue(newArr);
   //    //      if (res !== undefined) {
   //    //         ret[k] = res;
   //    //      }
   //    //   }
   //    return ret;
   // }
}

export class LinkedDomainConfiguration<DRN extends string, T> extends CommonLinkedDomainConfiguration<DRN, T> {}

export class ArrayOfLinkedDomainConfiguration<DRN extends string, T> extends CommonLinkedDomainConfiguration<DRN, T> {}
