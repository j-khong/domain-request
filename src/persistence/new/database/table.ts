import { DomainRequest, DomainResult, RequestReport } from '../../../DomainRequest/new/builder.ts';
import { isSomethingLike } from '../../../DomainRequest/type-checkers.ts';
import { TableDef, TableMapping, FieldMapping, isChild, ProcessResult } from './mapping.ts';
import { Persistence } from '../index.ts';

interface DbRecord {
   [key: string]: string | number | Date | boolean;
}
type SelectMethodResult = DbRecord[];
export type SelectMethod = (query: string) => Promise<SelectMethodResult>;

export class Table<DomainRequestName extends string> implements Persistence<DomainRequestName, any> {
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
      return res;

      // // 3. SELECT 1toN

      // for (const domFieldName in req.fields) {
      //    // find the mapping : table + field
      //    const fieldMap = mapping[domFieldName];
      //    if (fieldMap === undefined) {
      //       errors.push(`cannot find db mapping for domain field name [${domFieldName}]`);
      //       continue;
      //    }

      //    const res = fieldMap.processOneToMany(domFieldName, req.fields[domFieldName]);
      // }
   }

   private static async fetchOneToOne<DRN extends string, T>(
      tableDef: TableDef,
      mapping: TableMapping<Extract<keyof T, string>>,
      select: SelectMethod,
      req: DomainRequest<DRN, T>,
   ): Promise<DomainResult> {
      const errors = [];
      const fieldsToSelect = new Map<string, Set<TheMonster>>();

      const joins: Set<string> = new Set();

      const reqFields = { ...req.fields };
      if (reqFields[req.naturalKey[0]] === undefined) {
         reqFields[req.naturalKey[0]] = true;
      }

      for (const domFieldName in reqFields) {
         // find the mapping : table + field
         const fieldMap = mapping[domFieldName];
         if (fieldMap === undefined) {
            errors.push(`cannot find db mapping for domain field name [${domFieldName}]`);
            continue;
         }

         const res = fieldMap.process(domFieldName, reqFields[domFieldName]);
         if (res === undefined) {
            continue;
         }

         const tableName = res.tablename;
         let tbFields = fieldsToSelect.get(tableName);
         if (tbFields === undefined) {
            tbFields = new Set();
            fieldsToSelect.set(tableName, tbFields);
         }
         const processFN = (pr: ProcessResult, tbFields: Set<TheMonster>, path: string[]) => {
            path.push(pr.fieldnames.rootDomain);
            for (const fieldname of pr.fieldnames.children) {
               if (isChild(fieldname)) {
                  tbFields.add({
                     rootDomainFieldname: pr.fieldnames.rootDomain,
                     domainFieldname: fieldname.domain,
                     fieldnameAlias: createSqlAlias(pr.tablename, fieldname.db),
                     fieldSelectInstruction: createRequestFullFieldName(pr.tablename, fieldname.db),
                     fieldMapper: fieldMap,
                     result: res,
                     path,
                     toDomainConvert: fieldname.toDomainConvert,
                  });
               } else {
                  pr.joins.forEach((v) => joins.add(v));
                  // other child at the same level, need to copy the path
                  processFN(fieldname, tbFields, [...path]);
               }
            }
         };
         const path: string[] = [];
         processFN(res, tbFields, path);
      }

      const fieldsToMapResults = new Map<
         string, // fieldnameAlias
         {
            domainFieldname: string;
            rootDomainFieldname: string;
            fieldMapper: FieldMapping;
            result: ProcessResult;
            path: string[];
            toDomainConvert: (o: unknown) => unknown;
         }
      >();
      const fields: string[] = [];
      for (const [_key, value] of fieldsToSelect) {
         Array.from(value).forEach((v) => {
            fields.push(v.fieldSelectInstruction);

            fieldsToMapResults.set(v.fieldnameAlias, {
               rootDomainFieldname: v.rootDomainFieldname,
               domainFieldname: v.domainFieldname,
               fieldMapper: v.fieldMapper,
               result: v.result,
               path: v.path,
               toDomainConvert: v.toDomainConvert,
            });
         });
      }

      const results: DomainResult = {
         domainName: req.name,
         results: [],
         report: { requests: [] },
         total: 0,
      };
      const joinsSql = joins.size > 0 ? [...joins].join('\n') : '';
      // 1. COUNT SELECT
      const reqCountSql = `SELECT COUNT(${tableDef.name}.${tableDef.primaryKey}) AS total
 FROM ${tableDef.name}
 ${joinsSql}`;
      const { res: resCount, report: reportCount } = await executeRequest(select, reqCountSql);
      const total = resCount.length > 0 ? Number.parseInt(resCount[0].total as string) : 0;
      results.total = total;
      results.report.requests.push(reportCount);

      // 2. SELECT fields + 1to1
      const reqSql = `SELECT ${fields.join(', ')}
 FROM ${tableDef.name}
 ${joinsSql}
 LIMIT ${req.options.pagination.offset},${req.options.pagination.limit}`;

      const { res: dbResults, report } = await executeRequest(select, reqSql);
      results.report.requests.push(report);

      for (const dbRecord of dbResults) {
         const result = createResultAndPopulate(dbRecord, fieldsToMapResults);
         results.results.push(result);
      }
      return Promise.resolve(results);
   }
}

type TheMonster = {
   rootDomainFieldname: string;
   domainFieldname: string;
   fieldnameAlias: string;
   fieldSelectInstruction: string;
   fieldMapper: FieldMapping;
   result: ProcessResult;
   path: string[];
   toDomainConvert: (o: unknown) => unknown;
};
type FieldsToSelect<Fields> = Map<
   string,
   {
      domainFieldname: Extract<keyof Fields, string>;
      rootDomainFieldname: Extract<keyof Fields, string>;
      fieldMapper: FieldMapping;
      result: ProcessResult;
      path: string[];
      toDomainConvert: (o: unknown) => unknown;
   }
>;

function createResultAndPopulate<F>(dbRecord: DbRecord, fieldsToSelect: FieldsToSelect<F>): { [key: string]: unknown } {
   const result: { [key: string]: unknown } = {};
   for (const [key, value] of fieldsToSelect) {
      createTree(result, value.path, value.toDomainConvert(dbRecord[key]));
   }
   return result;
}

function createTree(struct: any, fieldnames: string[], value: any): void {
   if (fieldnames.length === 0) {
      return;
   }
   const lastPos = fieldnames.length - 1;
   for (let i = 0; i < lastPos; i++) {
      const name = fieldnames[i];
      if (struct[name] === undefined) {
         struct[name] = {};
      }
      struct = struct[name];
   }
   struct[fieldnames[lastPos]] = value;
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
