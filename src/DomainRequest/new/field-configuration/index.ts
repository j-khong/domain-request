import { camelToSnake, snakeToCamel } from '../../converters.ts';
import { isString, isSomethingLike } from '../../type-checkers.ts';

import { getOperators, Operator, RequestableFields, BoolTree, Tree, InputErrors } from '../../types.ts';
import { ObjectFieldConfiguration } from './object.ts';

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

export type FieldsTree = Tree;

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
      toSet: { [key: string]: Comparison<unknown> },
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

export interface Comparison<T> {
   operator: Operator;
   value: T;
}
