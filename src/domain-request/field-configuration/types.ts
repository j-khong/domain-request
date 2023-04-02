import { camelToSnake, snakeToCamel } from '../converters.ts';
import { BoolTree, Tree, InputErrors } from '../types.ts';
import { ObjectFieldConfiguration } from './object.ts';
export type FieldFilteringConfig<T> = {
   filtering?: {
      byRangeOfValue?: boolean;
      byListOfValue?: boolean;
   };
   values: {
      default: T;
      authorized?: Array<T>;
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
      _context: 'selected field' | 'filtering field',
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
      inputFilters: { [key: string]: unknown },
      fieldName: string,
      toSet: FiltersTree<unknown>,
      arrayToPush: 'and' | 'or',
   ):
      | {
           errors: InputErrors;
        }
      | undefined;

   // // abstract
   sanitizeOption(
      _inputOptions: { [key: string]: unknown },
      _fieldName: string,
      _toSet: Tree,
      _MAX_LIMIT: number,
      _isUnknown: (fieldName: string) => boolean,
   ):
      | {
           errors: InputErrors;
        }
      | undefined {
      return undefined;
   }

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

export type FilteringFields<Type> = {
   and: Array<FilterArrayType<Type>>;
   or: Array<FilterArrayType<Type>>;
};

export type FilterArrayType<Type> = { [Property in keyof Type]?: Comparison<Type> | FilteringFields<unknown> }; //Type[Property]

const filtersArrays = ['or', 'and'] as const;
export type FiltersArrays = typeof filtersArrays[number];
export function getFiltersArrays(): FiltersArrays[] {
   return filtersArrays.map((o) => o);
}

export type FiltersTree<Type> = FilteringFields<Type>;

const operators = [
   'equals',
   'greaterThan',
   'greaterThanOrEquals',
   'lesserThan',
   'lesserThanOrEquals',
   'between',
   'contains', // for strings
] as const;
export type Operator = typeof operators[number];

export function isComparison<T>(o: any): o is Comparison<T> {
   return o !== undefined && o.operator !== undefined && o.value !== undefined;
}

export function isComputedComparison<T>(o: any): o is ComputedComparison<T> {
   return o !== undefined && o.data !== undefined && isComparison(o);
}

export function isFilteringFields<T>(o: any): o is FilteringFields<T> {
   return o !== undefined && o.and !== undefined && o.or !== undefined && Array.isArray(o.and) && Array.isArray(o.or);
}

// export interface Comparison<T> {
//    operator: Operator;
//    value: T;
// }

export interface Comparison<Type> {
   operator: Operator;
   value: Type[Extract<keyof Type, string>];
}
export interface ComputedComparison<Type> extends Comparison<Type> {
   data: unknown;
}
// function isAndArrayComparison<T>(o: any): o is AndArrayComparison<T> {
//    return o.and !== undefined;
// }
// function isOrArrayComparison<T>(o: any): o is OrArrayComparison<T> {
//    return o.or !== undefined;
// }

export interface AndArrayComparison<Type> {
   and: Array<Comparison<Type>>;
}

export interface OrArrayComparison<Type> {
   or: Array<Comparison<Type>>;
}
