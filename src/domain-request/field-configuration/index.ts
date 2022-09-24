import { camelToSnake, snakeToCamel } from '../converters.ts';
import { BoolTree, Tree, InputErrors } from '../types.ts';
import { ObjectFieldConfiguration } from './object.ts';
export * from './types.ts';
import { FiltersTree } from './types.ts';
export type FieldFilteringConfig<T> = {
   filtering?: {
      byRangeOfValue?: boolean;
      byListOfValue?: boolean;
   };
   values: {
      default: T;
      authorized?: Array<T>;
      // typeValidator: (o: unknown) => o is T;
   };
};

export type DefaultFieldValues<Type> = {
   [Property in keyof Type]: Type[Property] | DefaultFieldValues<unknown>;
};

export abstract class DomainFieldConfiguration {
   init(_o: unknown): void {}

   abstract sanitizeField(
      inputFieldsToSelect: BoolTree,
      fieldName: string,
      toSet: BoolTree,
   ):
      | {
           errors: InputErrors;
        }
      | undefined;

   findErrors(
      _context: 'selected field' | 'filtering field' | 'option',
      _inputFieldsToSelect: Tree,
      _previous = '',
   ):
      | {
           errors: InputErrors;
        }
      | undefined {
      return undefined;
   }

   abstract sanitizeFilter(
      // sanitizeFilter(
      inputFilters: { [key: string]: unknown },
      fieldName: string,
      toSet: FiltersTree<unknown>,
      arrayToPush: 'and' | 'or',
   ):
      | {
           errors: InputErrors;
        }
      | undefined;
   //     {
   //    return undefined;
   // }

   protected camelToInputStyle<IN extends string, OUT extends string>(str: IN): OUT {
      return camelToSnake(str);
   }

   protected inputStyleToCamel<IN extends string, OUT extends string>(str: IN): OUT {
      return snakeToCamel(str);
   }
}

export type DomainConfig<Name extends string, T> = {
   name: Name;
   fields: ObjectFieldConfiguration<T>;
};
