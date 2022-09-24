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
// export type FiltersTree<Type> = {
//    [Property in keyof Type]: Type[Property] | FiltersTree<unknown>;
// };

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
function getOperators(): Operator[] {
   return operators.map((o) => o);
}

export function isComparison<T>(o: any): o is Comparison<T> {
   return o.operator !== undefined && o.value !== undefined;
}

export function isFilteringFields<T>(o: any): o is FilteringFields<T> {
   return o.and !== undefined && o.or !== undefined && Array.isArray(o.and) && Array.isArray(o.or);
}

// export interface Comparison<T> {
//    operator: Operator;
//    value: T;
// }

export interface Comparison<Type> {
   operator: Operator;
   value: Type[Extract<keyof Type, string>];
}
function isAndArrayComparison<T>(o: any): o is AndArrayComparison<T> {
   return o.and !== undefined;
}
function isOrArrayComparison<T>(o: any): o is OrArrayComparison<T> {
   return o.or !== undefined;
}

export interface AndArrayComparison<Type> {
   and: Array<Comparison<Type>>;
}

export interface OrArrayComparison<Type> {
   or: Array<Comparison<Type>>;
}
