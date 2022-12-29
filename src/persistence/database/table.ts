import { DomainRequest, DomainResult, RequestReport } from '../../domain-request/builder.ts';
import { isSomethingLike } from '../../domain-request/type-checkers.ts';
import { TableDef, TableMapping, isChild, ProcessResult, DomainPath } from './mapping.ts';
import { Persistence } from '../index.ts';
import { processAllFilters, addSetToSet, createRequestFullFieldName, createSqlAlias } from './functions.ts';

interface DbRecord {
   [key: string]: string | number | Date | boolean;
}
export type SelectMethodResult = DbRecord[];
export type SelectMethod = (query: string) => Promise<SelectMethodResult>;

export class Table<DomainRequestName extends string> implements Persistence<DomainRequestName, unknown> {
   private select: SelectMethod = (sql: string): Promise<SelectMethodResult> => {
      console.log(`SELECT METHOD is not SET for ${this.tableDef.name}`, sql);
      return Promise.resolve([]);
   };

   init(settings: unknown): void {
      if (!isSomethingLike(settings)) {
         throw new Error('please pass a sql select method');
      }
      this.select = (settings as { select: SelectMethod }).select;
   }

   constructor(
      private readonly tableDef: TableDef,
      private readonly mapping: TableMapping<string>,
      select?: SelectMethod,
   ) {
      if (select !== undefined) {
         this.select = select;
      }
   }

   async fetch(req: DomainRequest<DomainRequestName, any>): Promise<DomainResult> {
      const tableDef = this.tableDef;
      const mapping = this.mapping;
      const select = this.select;

      const res = await Table.fetchOneToOne(tableDef, mapping, select, req);

      await Table.fetchOneToMany(tableDef, mapping, select, req, res);

      return res;
   }

   private static async fetchOneToOne<DRN extends string, T>(
      tableDef: TableDef,
      mapping: TableMapping<Extract<keyof T, string>>,
      select: SelectMethod,
      req: DomainRequest<DRN, T>,
   ): Promise<DomainResult> {
      const results: DomainResult = {
         domainName: req.name,
         results: [],
         report: { requests: [] },
         total: 0,
         errors: [],
      };

      const fields: string[] = [];
      const joins: Set<string> = new Set();
      const fieldsToMapResults: FieldsToSelect = [];

      const processFN = (pr: ProcessResult, path: DomainPath[]) => {
         path.push(pr.fieldnames.rootDomain);
         for (const fieldname of pr.fieldnames.children) {
            pr.joins.forEach((v) => joins.add(v));
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

      //
      // process filters
      const {
         and: andFiltersArr,
         or: orFiltersArr,
         joins: filtersJoins,
      } = processAllFilters(req.filters, mapping, results.errors);
      if (orFiltersArr.length > 0) {
         andFiltersArr.push(`(${orFiltersArr.join(' OR ')})`);
      }
      addSetToSet(joins, filtersJoins);

      const where = andFiltersArr.length === 0 ? '' : `WHERE ${andFiltersArr.join(' AND ')}`;
      const joinsSql = joins.size > 0 ? [...joins].join('\n') : '';

      // 1. COUNT SELECT
      const reqCountSql = `SELECT COUNT(${tableDef.name}.${tableDef.primaryKey}) AS total
 FROM ${tableDef.name}
 ${joinsSql}
 ${where}`;
      const { res: resCount, report: reportCount } = await executeRequest(select, reqCountSql);
      const total = resCount.length > 0 ? Number.parseInt(resCount[0].total as string) : 0;
      results.total = total;
      results.report.requests.push(reportCount);

      const orderby = Table.buildOrderby(req, mapping, results.errors);

      // 2. SELECT fields + 1to1
      const reqSql = `SELECT ${fields.join(', ')}
 FROM ${tableDef.name}
 ${joinsSql}
 ${where}
 ${orderby}
 LIMIT ${req.options.pagination.offset},${req.options.pagination.limit}`;

      const { res: dbResults, report } = await executeRequest(select, reqSql);
      results.report.requests.push(report);

      for (const dbRecord of dbResults) {
         const result = createResultAndPopulate(dbRecord, fieldsToMapResults);
         results.results.push(result);
      }
      return Promise.resolve(results);
   }

   private static buildOrderby<DRN extends string, T>(
      req: DomainRequest<DRN, T>,
      mapping: TableMapping<Extract<keyof T, string>>,
      errors: string[],
   ): string {
      const fields = [];

      if (req.options.orderby !== undefined) {
         const fieldMap = mapping[req.options.orderby.fieldname];
         if (fieldMap === undefined) {
            errors.push(`cannot find db mapping for domain field name [${req.options.orderby.fieldname}]`);
         } else {
            const orderbys = fieldMap.getOrderBy(req.options);
            fields.push(...orderbys);
         }
      }

      for (const key in req.options) {
         if (key !== 'pagination' && key !== 'orderby') {
            const fieldMap = mapping[key as Extract<keyof T, string>];
            if (fieldMap === undefined) {
               errors.push(`cannot find db mapping for domain field name [${key}]`);
            } else {
               const orderbys = fieldMap.getOrderBy((req.options as any)[key]);
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
   ): Promise<void> {
      const ids = [];
      for (const v in res.results) {
         ids.push(res.results[v].id);
      }
      if (ids.length === 0) {
         return;
      }

      const dataByArray: Map<string, DataByArrayType> = new Map();

      const process1toN = (pr: ProcessResult, path: DomainPath[], data: DataByArrayType) => {
         path.push(pr.fieldnames.rootDomain);
         for (const fieldname of pr.fieldnames.children) {
            if (isChild(fieldname)) {
               data.fieldsToMapResults.push({
                  fieldnameAlias: fieldname.dbAlias,
                  path,
                  toDomainConvert: fieldname.toDomainConvert,
               });
               data.fields.push(fieldname.dbFullFieldName);
            } else {
               pr.joins.forEach((v) => data.joins.add(v));
               // other child at the same level, need to copy the path
               process1toN(fieldname, [...path], data);
            }
         }
      };
      const findAndProcessFirst1toN = (pr: ProcessResult, path: DomainPath[], prevJoin: string[]) => {
         path.push(pr.fieldnames.rootDomain);
         if (pr.fieldnames.rootDomain.type === 'array') {
            let data = dataByArray.get(pr.fieldnames.rootDomain.name);
            if (data === undefined) {
               data = {
                  fields: [],
                  joins: new Set(),
                  fieldsToMapResults: [],
               };
               dataByArray.set(pr.fieldnames.rootDomain.name, data);
            }
            prevJoin.forEach((v) => data?.joins.add(v));

            for (const fieldname of pr.fieldnames.children) {
               if (isChild(fieldname)) {
                  data.fieldsToMapResults.push({
                     fieldnameAlias: fieldname.dbAlias,
                     path,
                     toDomainConvert: fieldname.toDomainConvert,
                  });
                  data.fields.push(fieldname.dbFullFieldName);
               } else {
                  pr.joins.forEach((v) => data?.joins.add(v));
                  // other child at the same level, need to copy the path
                  process1toN(fieldname, [...path], data);
               }
            }
         } else {
            for (const fieldname of pr.fieldnames.children) {
               if (!isChild(fieldname)) {
                  findAndProcessFirst1toN(fieldname, [...path], pr.joins);
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

         const resp = fieldMap.processOneToMany(domFieldName, req.fields[domFieldName]);
         if (resp === undefined) {
            continue;
         }

         const path: DomainPath[] = [];
         findAndProcessFirst1toN(resp, path, []);
      }

      if (dataByArray.size === 0) {
         return;
      }

      const pk = `${tableDef.name}.${tableDef.primaryKey}`;
      const where = `WHERE ${pk} IN (${ids.join(', ')})`;

      for (const [key, value] of dataByArray) {
         const joinsSql = value.joins.size > 0 ? [...value.joins].join('\n') : '';

         const reqSql = `SELECT ${[
            createRequestFullFieldName(tableDef.name, tableDef.primaryKey),
            ...value.fields,
         ].join(', ')}
 FROM ${tableDef.name}
 ${joinsSql}
 ${where}
 `; // TODO put orderby and limit of the filter
         //  LIMIT ${req.options.pagination.offset},${req.options.pagination.limit}

         const { res: dbResults, report } = await executeRequest(select, reqSql);
         res.report.requests.push(report);

         for (const dbRecord of dbResults) {
            populateResultsWith1toN(
               createSqlAlias(tableDef.name, tableDef.primaryKey),
               res.results,
               dbRecord,
               value.fieldsToMapResults,
            );
         }
      }
   }
}

type DataByArrayType = {
   fields: string[];
   joins: Set<string>;
   fieldsToMapResults: FieldsToSelect;
};

function populateResultsWith1toN(key: string, res: any[], dbRecord: DbRecord, fieldsToSelect: FieldsToSelect): void {
   const keyValue = dbRecord[key];
   if (keyValue === undefined || fieldsToSelect.length === 0) {
      return;
   }

   const toPopulate = res.find((v) => v.id == keyValue); // weak comparison on id
   if (toPopulate === undefined) {
      return;
   }

   const structuredValue = {};
   for (const field of fieldsToSelect) {
      let tmpStruct = toPopulate;
      for (const pathEl of field.path) {
         if (pathEl.type === 'value') {
            continue;
         }

         if (tmpStruct[pathEl.name] === undefined) {
            if (pathEl.type === 'array') {
               tmpStruct[pathEl.name] = [];
            } else if (pathEl.type === 'object') {
               tmpStruct[pathEl.name] = {};
            }
         }
         tmpStruct = tmpStruct[pathEl.name];
      }
      populateValueTree(structuredValue, field.path, field.toDomainConvert(dbRecord[field.fieldnameAlias]));
   }
   goThrough(structuredValue, toPopulate);
}

function goThrough(data: any, toPopulate: any): void {
   for (const key in data as any) {
      if (Array.isArray(toPopulate[key])) {
         toPopulate[key].push((data as any)[key]);
      } else if (typeof toPopulate[key] === 'object') {
         goThrough(data[key], toPopulate[key]);
      } else {
         toPopulate[key] = (data as any)[key];
      }
   }
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
   if (fieldnames.length === 0) {
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

export async function executeRequest(
   select: SelectMethod,
   sql: string,
): Promise<{
   res: SelectMethodResult;
   report: RequestReport;
}> {
   const start = new Date();
   const res = [];
   let error: string | undefined;
   try {
      const tmp = await select(sql);
      res.push(...tmp);
   } catch (e) {
      error = e.message;
   }
   const end = new Date();
   const report: RequestReport = {
      request: sql.replaceAll('\n', ' '),
      timeInMs: end.getTime() - start.getTime(),
      error,
   };
   return { res, report };
}
