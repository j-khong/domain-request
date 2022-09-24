import { DomainRequest, DomainResult, RequestReport } from '../../../DomainRequest/new/builder.ts';
import { isSomethingLike } from '../../../DomainRequest/type-checkers.ts';
import { TableDef, TableMapping, isChild, ProcessResult, DomainPath } from './mapping.ts';
import { Persistence } from '../index.ts';
import { processAllFilters, addSetToSet } from './functions.ts';

interface DbRecord {
   [key: string]: string | number | Date | boolean;
}
type SelectMethodResult = DbRecord[];
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
            if (isChild(fieldname)) {
               fieldsToMapResults.push({
                  fieldnameAlias: createSqlAlias(pr.tablename, fieldname.db),
                  path,
                  toDomainConvert: fieldname.toDomainConvert,
               });
               fields.push(createRequestFullFieldName(pr.tablename, fieldname.db));
            } else {
               pr.joins.forEach((v) => joins.add(v));
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

         const res = fieldMap.process(domFieldName, reqFields[domFieldName]);
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

      // 2. SELECT fields + 1to1
      const reqSql = `SELECT ${fields.join(', ')}
 FROM ${tableDef.name}
 ${joinsSql}
 ${where}
 LIMIT ${req.options.pagination.offset},${req.options.pagination.limit}`;

      const { res: dbResults, report } = await executeRequest(select, reqSql);
      results.report.requests.push(report);

      for (const dbRecord of dbResults) {
         const result = createResultAndPopulate(dbRecord, fieldsToMapResults);
         results.results.push(result);
      }
      return Promise.resolve(results);
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

      const dataByArray: Map<
         string,
         {
            fields: string[];
            joins: Set<string>;
            fieldsToMapResults: FieldsToSelect;
         }
      > = new Map();
      // const fields: string[] = [];
      // const joins: Set<string> = new Set();
      // const fieldsToMapResults: FieldsToSelect = [];

      const processFN = (pr: ProcessResult, path: DomainPath[]) => {
         path.push(pr.fieldnames.rootDomain);
         let data = dataByArray.get(path[0].name);
         if (data === undefined) {
            data = {
               fields: [],
               joins: new Set(),
               fieldsToMapResults: [],
            };
            dataByArray.set(path[0].name, data);
         }
         for (const fieldname of pr.fieldnames.children) {
            if (isChild(fieldname)) {
               data.fieldsToMapResults.push({
                  fieldnameAlias: createSqlAlias(pr.tablename, fieldname.db),
                  path,
                  toDomainConvert: fieldname.toDomainConvert,
               });
               data.fields.push(createRequestFullFieldName(pr.tablename, fieldname.db));
            } else {
               pr.joins.forEach((v) => data?.joins.add(v));
               // other child at the same level, need to copy the path
               processFN(fieldname, [...path]);
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
         processFN(resp, path);
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
 `; // TODO put limit of the filter

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

function populateResultsWith1toN(key: string, res: any[], dbRecord: DbRecord, fieldsToSelect: FieldsToSelect): void {
   const keyValue = dbRecord[key];
   if (keyValue === undefined) {
      return;
   }

   const toPopulate = res.find((v) => v.id == keyValue); // weak comparison on id
   if (toPopulate === undefined) {
      return;
   }

   const obj: any = { domainname: '', v: {} };
   for (const field of fieldsToSelect) {
      const toPop = {};
      createTree(toPop, field.path, field.toDomainConvert(dbRecord[field.fieldnameAlias]));

      const domainname = field.path[0].name;
      if (toPopulate[domainname] === undefined) {
         toPopulate[domainname] = [];
      }
      obj.domainname = domainname;
      obj.v = { ...obj.v, ...(toPop as any)[domainname] };
   }
   toPopulate[obj.domainname].push(obj.v);
}

type FieldsToSelect = Array<{
   fieldnameAlias: string;
   path: DomainPath[];
   toDomainConvert: (o: unknown) => unknown;
}>;

function createResultAndPopulate<F>(dbRecord: DbRecord, fieldsToSelect: FieldsToSelect): { [key: string]: unknown } {
   const result: { [key: string]: unknown } = {};
   for (const field of fieldsToSelect) {
      createTree(result, field.path, field.toDomainConvert(dbRecord[field.fieldnameAlias]));
   }
   return result;
}

function createTree(struct: any, fieldnames: DomainPath[], value: any): void {
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

function createRequestFullFieldName(tableName: string, fieldName: string): string {
   return `${tableName}.${fieldName} AS ${createSqlAlias(tableName, fieldName)}`;
}

const aliasSep = '$';

function createSqlAlias(tableName: string, fieldName: string): string {
   return `${tableName}${aliasSep}${fieldName}`;
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
      request: sql,
      timeInMs: end.getTime() - start.getTime(),
      error,
   };
   return { res, report };
}
