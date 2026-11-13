import { DomainRequest, DomainResult, RequestReport } from '../../domain-request/builder.ts';
import { isSomethingLike } from '../../domain-request/type-checkers.ts';
import { TableDef, TableMapping, isChild, ProcessResult, DomainPath } from './mapping.ts';
import { Persistence } from '../index.ts';
import { processAllFilters, createRequestFullFieldName, createSqlAlias } from './functions.ts';
import { Dialect, defaultDialect } from './dialect.ts';
import { createSqlParam, extractSqlParams, SqlParam } from './params.ts';
import { FiltersTree, isFilteringFields, Options } from '../../domain-request/field-configuration/index.ts';
import { FilterArrayType } from '../../domain-request/field-configuration/types.ts';

interface DbRecord {
   [key: string]: string | number | Date | boolean | null;
}
export type SelectMethodResult = DbRecord[];
/**
 * @param query sql request, where the values coming from the filters are replaced with placeholders
 * ("?", or "$1", "$2"... for postgres)
 * @param params values to bind to the placeholders, in the same order
 */
export type SelectMethod = (query: string, params: SqlParam[]) => Promise<SelectMethodResult>;

export type TableOptions = {
   /** sql dialect of the database, "mysql" by default */
   dialect?: Dialect;
};

export class Table<DomainRequestName extends string> implements Persistence<DomainRequestName, unknown> {
   private dialect: Dialect = defaultDialect;
   private select: SelectMethod = (): Promise<SelectMethodResult> => {
      return Promise.reject(
         new Error(`no select method set for table [${this.tableDef.name}]: pass it to the constructor or to init()`),
      );
   };

   init(settings: unknown): void {
      if (!isSomethingLike(settings)) {
         throw new Error('please pass a sql select method');
      }
      const { select, dialect } = settings as { select: SelectMethod; dialect?: Dialect };
      this.select = select;
      this.dialect = dialect ?? this.dialect;
   }

   constructor(
      private readonly tableDef: TableDef,
      private readonly mapping: TableMapping<string>,
      select?: SelectMethod,
      options?: TableOptions,
   ) {
      if (select !== undefined) {
         this.select = select;
      }
      this.dialect = options?.dialect ?? this.dialect;
   }

   async fetch(req: DomainRequest<DomainRequestName, any>): Promise<DomainResult> {
      const tableDef = this.tableDef;
      const mapping = this.mapping;
      const select = this.select;
      const dialect = this.dialect;

      const { results, resultsByPk } = await Table.fetchOneToOne(tableDef, mapping, select, req, dialect);

      await Table.fetchOneToMany(tableDef, mapping, select, req, results, resultsByPk, dialect);

      return results;
   }

   private static async fetchOneToOne<DRN extends string, T>(
      tableDef: TableDef,
      mapping: TableMapping<Extract<keyof T, string>>,
      select: SelectMethod,
      req: DomainRequest<DRN, T>,
      dialect: Dialect,
   ): Promise<{ results: DomainResult; resultsByPk: ResultsByPk }> {
      const results: DomainResult = {
         domainName: req.name,
         results: [],
         report: { requests: [] },
         total: 0,
         errors: [],
      };
      const resultsByPk: ResultsByPk = new Map();

      const fields: string[] = [];
      const fieldsJoins: Set<string> = new Set();
      const fieldsToMapResults: FieldsToSelect = [];

      const processFN = (pr: ProcessResult, path: DomainPath[]) => {
         path.push(pr.fieldnames.rootDomain);
         for (const fieldname of pr.fieldnames.children) {
            pr.joins.forEach((v) => fieldsJoins.add(v));
            if (isChild(fieldname)) {
               fieldsToMapResults.push({
                  fieldnameAlias: fieldname.dbAlias,
                  path,
                  toDomainConvert: fieldname.toDomainConvert,
               });
               fields.push(fieldname.dbFullFieldName);
            } else {
               // other child at the same level, need to copy the path
               processFN(fieldname, [...path]);
            }
         }
      };

      // add pk if not already requested
      const reqFields = { ...req.fields };
      if (reqFields[req.naturalKey[0]] === undefined) {
         reqFields[req.naturalKey[0]] = true;
      }

      //
      // process fields
      for (const domFieldName in reqFields) {
         // find the mapping : table + field
         const fieldMap = mapping[domFieldName];
         if (fieldMap === undefined) {
            results.errors.push(`cannot find db mapping for domain field name [${domFieldName}]`);
            continue;
         }

         const res = fieldMap.processField(domFieldName, reqFields[domFieldName]);
         if (res === undefined) {
            continue;
         }

         const path: DomainPath[] = [];
         processFN(res, path);
      }

      // the table primary key is always fetched, as the one to many results are attached thanks to it
      const pk = `${tableDef.name}.${tableDef.primaryKey}`;
      const pkAlias = createSqlAlias(tableDef.name, tableDef.primaryKey);
      addOnce(fields, createRequestFullFieldName(tableDef.name, tableDef.primaryKey));

      //
      // process filters
      const {
         and: andFiltersArr,
         or: orFiltersArr,
         joins: filtersJoins,
      } = processAllFilters(req.filters, mapping, results.errors, dialect);
      if (orFiltersArr.length > 0) {
         andFiltersArr.push(`(${orFiltersArr.join(' OR ')})`);
      }

      const where = andFiltersArr.length === 0 ? '' : `WHERE ${andFiltersArr.join(' AND ')}`;
      const filtersJoinsSql = [...filtersJoins].join('\n');

      // 1. COUNT SELECT
      const reqCountSql = `SELECT COUNT(DISTINCT ${pk}) AS total
 FROM ${tableDef.name}
 ${[...new Set([...fieldsJoins, ...filtersJoins])].join('\n')}
 ${where}`;
      const resCount = await executeAndReport(select, reqCountSql, results, dialect);
      results.total = resCount.length > 0 ? Number.parseInt(resCount[0].total as string) : 0;

      const generatedOrderby = Table.buildOrderby(req.options, mapping, results.errors);
      const orderby = generatedOrderby.length > 0 ? `${generatedOrderby}, ${pk} ASC` : `ORDER BY ${pk} ASC`;

      // the joins of the filters may multiply the rows (one to many),
      // so they are isolated in a sub request to get each row once, whatever the database
      const selectWhere =
         filtersJoins.size === 0
            ? where
            : `WHERE ${pk} IN (SELECT ${pk} FROM ${tableDef.name}
 ${filtersJoinsSql}
 ${where})`;

      // 2. SELECT fields + 1to1
      const reqSql = `SELECT ${fields.join(', ')}
 FROM ${tableDef.name}
 ${[...fieldsJoins].join('\n')}
 ${selectWhere}
 ${orderby}
 ${buildLimit(req.options.pagination)}`;

      const dbResults = await executeAndReport(select, reqSql, results, dialect);

      for (const dbRecord of dbResults) {
         const result = createResultAndPopulate(dbRecord, fieldsToMapResults);
         results.results.push(result);
         resultsByPk.set(String(dbRecord[pkAlias]), { pkValue: dbRecord[pkAlias], result });
      }
      return { results, resultsByPk };
   }

   private static buildOrderby<T>(
      options: Options<Extract<keyof T, string>>,
      mapping: TableMapping<Extract<keyof T, string>>,
      errors: string[],
   ): string {
      const fields = [];

      if (options.orderby !== undefined) {
         const fieldMap = mapping[options.orderby.fieldname];
         if (fieldMap === undefined) {
            errors.push(`cannot find db mapping for domain field name [${options.orderby.fieldname}]`);
         } else {
            const orderbys = fieldMap.getOrderBy(options);
            fields.push(...orderbys);
         }
      }

      const optionNames = ['pagination', 'orderby', 'useFilter'];
      for (const key in options) {
         if (!optionNames.includes(key)) {
            const fieldMap = mapping[key as Extract<keyof T, string>];
            if (fieldMap === undefined) {
               errors.push(`cannot find db mapping for domain field name [${key}]`);
            } else {
               const orderbys = fieldMap.getOrderBy((options as any)[key]);
               fields.push(...orderbys);
            }
         }
      }

      return fields.length > 0 ? `ORDER BY ${fields.join(', ')}` : '';
   }

   private static async fetchOneToMany<DRN extends string, T>(
      tableDef: TableDef,
      mapping: TableMapping<Extract<keyof T, string>>,
      select: SelectMethod,
      req: DomainRequest<DRN, T>,
      res: DomainResult,
      resultsByPk: ResultsByPk,
      dialect: Dialect,
   ): Promise<void> {
      if (resultsByPk.size === 0) {
         return;
      }

      const dataByArray: Map<string, DataByArrayType> = new Map();
      const getRelationOrderBy = (pr: ProcessResult): string => {
         const primaryKey = pr.primaryKey ?? 'id';
         const firstJoin = pr.joins[0];
         if (firstJoin !== undefined) {
            const match = firstJoin.match(/JOIN\s+([^\s]+)\s+ON/i);
            if (match !== null && match[1] !== undefined) {
               return `${match[1]}.${primaryKey} ASC`;
            }
         }
         return `${pr.tablename}.${primaryKey} ASC`;
      };

      const process1toN = (pr: ProcessResult, parentPath: DomainPath[], data: DataByArrayType) => {
         const pathElement: DomainPath = { ...pr.fieldnames.rootDomain };
         if (pathElement.type === 'array') {
            addOnce(data.orderByTieBreakers, getRelationOrderBy(pr));
            if (pr.primaryKey !== undefined) {
               // the key tells which rows belong to the same element, when a nested one to many multiplies the rows
               pathElement.keyAlias = createSqlAlias(pr.tablename, pr.primaryKey);
               addOnce(data.fields, createRequestFullFieldName(pr.tablename, pr.primaryKey));
            }
         }
         const path = [...parentPath, pathElement];
         pr.joins.forEach((v) => data.joins.add(v));

         for (const fieldname of pr.fieldnames.children) {
            if (isChild(fieldname)) {
               data.fieldsToMapResults.push({
                  fieldnameAlias: fieldname.dbAlias,
                  path,
                  toDomainConvert: fieldname.toDomainConvert,
               });
               addOnce(data.fields, fieldname.dbFullFieldName);
            } else {
               process1toN(fieldname, path, data);
            }
         }
      };
      const findAndProcessFirst1toN = (pr: ProcessResult, parentPath: DomainPath[], prevJoins: string[]) => {
         if (pr.fieldnames.rootDomain.type === 'array') {
            let data = dataByArray.get(pr.fieldnames.rootDomain.name);
            if (data === undefined) {
               data = {
                  fields: [],
                  joins: new Set(),
                  fieldsToMapResults: [],
                  orderByTieBreakers: [],
               };
               dataByArray.set(pr.fieldnames.rootDomain.name, data);
            }
            for (const join of prevJoins) {
               data.joins.add(join);
            }
            process1toN(pr, parentPath, data);
         } else {
            const path = [...parentPath, pr.fieldnames.rootDomain];
            for (const fieldname of pr.fieldnames.children) {
               if (!isChild(fieldname)) {
                  findAndProcessFirst1toN(fieldname, path, [...prevJoins, ...pr.joins]);
               }
            }
         }
      };

      for (const domFieldName in req.fields) {
         // find the mapping : table + field
         const fieldMap = mapping[domFieldName];
         if (fieldMap === undefined) {
            res.errors.push(`cannot find db mapping for domain field name [${domFieldName}]`);
            continue;
         }

         const resp = fieldMap.processOneToMany(domFieldName, req.fields[domFieldName], res.errors);
         if (resp === undefined) {
            continue;
         }

         findAndProcessFirst1toN(resp, [], []);
      }

      if (dataByArray.size === 0) {
         return;
      }

      const pk = `${tableDef.name}.${tableDef.primaryKey}`;
      const pkAlias = createSqlAlias(tableDef.name, tableDef.primaryKey);
      const pkValues = [...resultsByPk.values()].map((v) => toSqlKey(v.pkValue));
      const commonWhere = `WHERE ${pk} IN (${pkValues.join(', ')})`;
      const elementsByKey: ElementsByKey = new WeakMap();

      for (const [key, value] of dataByArray) {
         let orderby = '';
         let limit = '';
         let andFiltersArr: string[] = [];
         const orderByTieBreakers = [`${pk} ASC`, ...value.orderByTieBreakers];

         const fieldOptions = req.options[key as keyof Options<Extract<keyof T, string>>];
         if (
            fieldOptions !== undefined &&
            isSomethingLike<Options<Extract<keyof T, string>>>(fieldOptions) &&
            fieldOptions.useFilter === true
         ) {
            const fo = fieldOptions as Options<Extract<keyof T, string>>;
            const { and, or: orFiltersArr } = processAllFilters(
               extractFilter(key as Extract<keyof T, string>, req.filters),
               mapping,
               res.errors,
               dialect,
            );
            if (and.length > 0) {
               andFiltersArr = and;
            }
            if (orFiltersArr.length > 0) {
               andFiltersArr.push(`(${orFiltersArr.join(' OR ')})`);
            }
            const generatedNestedOrderby = Table.buildOrderby(fo, mapping, res.errors);
            orderby =
               generatedNestedOrderby.length > 0
                  ? `${generatedNestedOrderby}, ${orderByTieBreakers.join(', ')}`
                  : `ORDER BY ${pk} ASC`;
            limit = buildLimit(fo.pagination);
         }

         if (orderby.length === 0) {
            orderby = `ORDER BY ${orderByTieBreakers.join(', ')}`;
         }

         const where = andFiltersArr.length === 0 ? commonWhere : `${commonWhere} AND ${andFiltersArr.join(' AND ')}`;
         const joinsSql = value.joins.size > 0 ? [...value.joins].join('\n') : '';

         const fields = [createRequestFullFieldName(tableDef.name, tableDef.primaryKey)];
         for (const field of value.fields) {
            addOnce(fields, field);
         }

         const reqSql = `SELECT ${fields.join(', ')}
 FROM ${tableDef.name}
 ${joinsSql}
 ${where}
 ${orderby}
 ${limit}
 `;

         const dbResults = await executeAndReport(select, reqSql, res, dialect);

         for (const dbRecord of dbResults) {
            const toPopulate = resultsByPk.get(String(dbRecord[pkAlias]));
            if (toPopulate !== undefined) {
               populateResultWith1toN(toPopulate.result, dbRecord, value.fieldsToMapResults, elementsByKey);
            }
         }
      }
   }
}

function extractFilter<T>(key: Extract<keyof T, string>, filters: FiltersTree<T>): FiltersTree<T> {
   const ret: FiltersTree<T> = { or: [], and: [] };
   for (const f of filters.and) {
      if (isFilteringFields(f[key])) {
         ret.and.push({ [key]: f[key] } as FilterArrayType<T>);
      }
   }
   for (const f of filters.or) {
      if (isFilteringFields(f[key])) {
         ret.or.push({ [key]: f[key] } as FilterArrayType<T>);
      }
   }
   return ret;
}

type DataByArrayType = {
   fields: string[];
   joins: Set<string>;
   fieldsToMapResults: FieldsToSelect;
   orderByTieBreakers: string[];
};

type DbValue = DbRecord[string];
type ResultsByPk = Map<string, { pkValue: DbValue; result: any }>;
// for each array of the results, its elements by key
type ElementsByKey = WeakMap<any[], Map<string, any>>;

function addOnce(array: string[], value: string): void {
   if (!array.includes(value)) {
      array.push(value);
   }
}

function toSqlKey(value: DbValue): string {
   if ((typeof value === 'number' && Number.isFinite(value)) || typeof value === 'bigint') {
      return `${value}`;
   }
   return createSqlParam(String(value));
}

function buildLimit(pagination: { offset: number; limit: number }): string {
   return `LIMIT ${toPositiveInteger(pagination.limit)} OFFSET ${toPositiveInteger(pagination.offset)}`;
}

function toPositiveInteger(value: unknown): number {
   const n = Math.trunc(Number(value));
   return Number.isFinite(n) && n > 0 ? n : 0;
}

function populateResultWith1toN(
   toPopulate: any,
   dbRecord: DbRecord,
   fieldsToSelect: FieldsToSelect,
   elementsByKey: ElementsByKey,
): void {
   // for the arrays without key, each db record is one element
   const recordElements = new Map<any[], any>();

   for (const field of fieldsToSelect) {
      const value = field.toDomainConvert(dbRecord[field.fieldnameAlias]);
      const lastPos = field.path.length - 1;
      // without value, the arrays are still created, so that the ones without element are empty arrays
      const stopAt = value === undefined ? field.path.map((p) => p.type).lastIndexOf('array') : lastPos;

      let struct = toPopulate;
      for (let i = 0; i < lastPos && i <= stopAt && struct !== undefined; i++) {
         const pathEl = field.path[i];
         if (pathEl.type === 'value') {
            continue;
         }
         if (struct[pathEl.name] === undefined) {
            struct[pathEl.name] = pathEl.type === 'array' ? [] : {};
         }
         if (pathEl.type === 'object') {
            struct = struct[pathEl.name];
         } else if (value === undefined && i === stopAt) {
            struct = undefined;
         } else {
            struct = getArrayElement(
               struct[pathEl.name],
               pathEl,
               dbRecord,
               elementsByKey,
               recordElements,
               value !== undefined,
            );
         }
      }

      if (struct !== undefined && value !== undefined) {
         struct[field.path[lastPos].name] = value;
      }
   }
}

function getArrayElement(
   array: any[],
   pathEl: DomainPath,
   dbRecord: DbRecord,
   elementsByKey: ElementsByKey,
   recordElements: Map<any[], any>,
   createWithoutKey: boolean,
): any {
   if (pathEl.keyAlias === undefined) {
      let element = recordElements.get(array);
      if (element === undefined && createWithoutKey) {
         element = {};
         array.push(element);
         recordElements.set(array, element);
      }
      return element;
   }

   const key = dbRecord[pathEl.keyAlias];
   if (key === undefined || key === null) {
      // no row in the joined table
      return undefined;
   }
   let elements = elementsByKey.get(array);
   if (elements === undefined) {
      elements = new Map();
      elementsByKey.set(array, elements);
   }
   let element = elements.get(String(key));
   if (element === undefined) {
      element = {};
      array.push(element);
      elements.set(String(key), element);
   }
   return element;
}

type FieldsToSelect = Array<{
   fieldnameAlias: string;
   path: DomainPath[];
   toDomainConvert: (o: unknown) => unknown;
}>;

function createResultAndPopulate<F>(dbRecord: DbRecord, fieldsToSelect: FieldsToSelect): { [key: string]: unknown } {
   const result: { [key: string]: unknown } = {};
   for (const field of fieldsToSelect) {
      populateValueTree(result, field.path, field.toDomainConvert(dbRecord[field.fieldnameAlias]));
   }
   return result;
}

function populateValueTree(struct: any, fieldnames: DomainPath[], value: any): void {
   if (fieldnames.length === 0 || value === undefined) {
      return;
   }

   const lastPos = fieldnames.length - 1;
   for (let i = 0; i < lastPos; i++) {
      const name = fieldnames[i];
      if (struct[name.name] === undefined) {
         struct[name.name] = {};
      }
      struct = struct[name.name];
   }

   struct[fieldnames[lastPos].name] = value;
}

// executes the request, adds its report to the results, and its error if it failed
async function executeAndReport(
   select: SelectMethod,
   sql: string,
   results: DomainResult,
   dialect: Dialect,
): Promise<SelectMethodResult> {
   const { res, report } = await executeRequest(select, sql, dialect);
   results.report.requests.push(report);
   if (report.error !== undefined) {
      results.errors.push(`database request failed: ${report.error}`);
   }
   return res;
}

export async function executeRequest(
   select: SelectMethod,
   sql: string,
   dialect: Dialect = defaultDialect,
): Promise<{
   res: SelectMethodResult;
   report: RequestReport;
}> {
   const { sql: request, params } = extractSqlParams(sql, dialect);
   const start = new Date();
   let res: SelectMethodResult = [];
   let error: string | undefined;
   try {
      res = await select(request, params);
   } catch (e) {
      error = e instanceof Error ? e.message : String(e);
   }
   const end = new Date();
   const report: RequestReport = {
      request: request.replaceAll('\n', ' '),
      params,
      timeInMs: end.getTime() - start.getTime(),
      error,
   };
   return { res, report };
}
