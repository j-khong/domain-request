import { TableMapping } from './mapping.ts';
import { FilterArrayType, FilteringFields } from '../../domain-request/field-configuration/types.ts';

export function processAllFilters<T>(
   filters: FilteringFields<T>,
   mapping: TableMapping<Extract<keyof T, string>>,
   errors: string[],
): { or: string[]; and: string[]; joins: Set<string> } {
   const filtersArr: { or: string[]; and: string[]; joins: Set<string> } = {
      or: [],
      and: [],
      joins: new Set<string>(),
   };

   console.log('filters:', filters);
   // console.log('mapping:', mapping);
   const and = processFilters(filters.and, mapping, errors);
   console.log('and:', and);
   filtersArr.and.push(...and.filters);
   addSetToSet(filtersArr.joins, and.joins);

   const or = processFilters(filters.or, mapping, errors);
   filtersArr.or.push(...or.filters);
   addSetToSet(filtersArr.joins, or.joins);

   return filtersArr;
}

function processFilters<T>(
   filters: Array<FilterArrayType<T>>,
   mapping: TableMapping<Extract<keyof T, string>>,
   errors: string[],
): { filters: string[]; joins: Set<string> } {
   const filtersArr: { filters: string[]; joins: Set<string> } = { filters: [], joins: new Set<string>() };
   for (const theFilter of filters) {
      // find the mapping : table + field
      const domFieldName = Object.keys(theFilter)[0] as Extract<keyof T, string>;
      const fieldMap = mapping[domFieldName];
      if (fieldMap === undefined) {
         errors.push(`cannot find db mapping for domain field name [${domFieldName}]`);
         continue;
      }

      const res = fieldMap.processAllFilters(domFieldName, theFilter, errors);

      if (res.or.length > 0) {
         res.and.push(`(${res.or.join(' OR ')})`);
      }
      if (res.and.length > 0) {
         filtersArr.filters.push(`(${res.and.join(' AND ')})`);
      }
      addArrayToSet(res.joins, filtersArr.joins);
   }
   return filtersArr;
}

function addArrayToSet(array: string[], set: Set<string>): void {
   for (const v of array) {
      set.add(v);
   }
}

export function addSetToSet(setToPopulate: Set<string>, setToAdd: Set<string>): void {
   for (const v of setToAdd) {
      setToPopulate.add(v);
   }
}

export function createRequestFullFieldName(tableName: string, fieldName: string): string {
   return `${tableName}.${fieldName} AS ${createSqlAlias(tableName, fieldName)}`;
}

const aliasSep = '$';

export function createSqlAlias(tableName: string, fieldName: string): string {
   return `${tableName}${aliasSep}${fieldName}`;
}
