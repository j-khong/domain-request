export type LeafType = string | number | Date | boolean;
export type Leaf = LeafType | Array<LeafType>;
// type Leaf= unknown
export interface Tree {
   [key: string]: Leaf | Tree;
}

export interface BoolTree {
   [key: string]: boolean | BoolTree;
}

export type IsoDate = string;
export type NaturalKey<Type extends string> = Type[];

export interface DomainFields {
   [key: string]: any;
}

//
// REQUESTABLE FIELDS
//
export type RequestableFields<Type> = {
   [Property in keyof Type]: boolean | RequestableFields<unknown>;
};
type Unarray<T> = T extends Array<infer U> ? NestedRequestableFields<U> : NestedRequestableFields<T>;

export type NestedRequestableFields<Type> = {
   [Property in keyof Type]: Type[Property] extends string | number | boolean ? boolean : Unarray<Type[Property]>;
};

//
// FILTERING FIELDS
//
const filtersArrays = ['or', 'and'] as const;
export type FiltersArrays = typeof filtersArrays[number];
export function getFiltersArrays(): FiltersArrays[] {
   return filtersArrays.map((o) => o);
}

type Toarray<T> = T extends Array<infer U> ? Array<NestedFilteringFields<U>> : NestedFilteringFields<T>;

export type NestedFilteringFields<Type> = {
   [Property in keyof Type]?: Type[Property] extends string | number | boolean
      ? Type[Property]
      : Toarray<Type[Property]>;
};

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
export function getOperators(): Operator[] {
   return operators.map((o) => o);
}

//
// REQUEST OPTIONS
//
export interface Options<Fields extends DomainFields> {
   pagination: {
      offset: number;
      limit: number;
   };
   orderby?: {
      fieldname: keyof Fields;
      sort: OrderbySort;
   };
   useFilter?: boolean;
}
const orderbySort = ['asc', 'desc'] as const;
export type OrderbySort = typeof orderbySort[number];
export function isOrderbySort(o: unknown): o is OrderbySort {
   return o !== undefined && orderbySort.includes(o as OrderbySort);
}
export function getOrderbySort(): OrderbySort[] {
   return orderbySort.map((o) => o);
}
//
// ERRORS
//

interface InputError {
   context: 'selected field' | 'filtering field' | 'option';
   fieldName: string;
   reason: string;
}

export type InputErrors = InputError[];
