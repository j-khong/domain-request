import { DomainRequest, DomainResult, RequestReport } from '../../../DomainRequest/new/builder.ts';
import { isSomethingLike } from '../../../DomainRequest/type-checkers.ts';
import { TableDef, TableMapping, FieldMapping } from './mapping.ts';
import { ToDbSqlConverter } from './converters.ts';
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
      //   console.log('req:', req);

      const res = await Table.fetchOneToOne(tableDef, mapping, select, req);
      console.log('res:', res);
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

      for (const domFieldName in req.fields) {
         // find the mapping : table + field
         const fieldMap = mapping[domFieldName];
         if (fieldMap === undefined) {
            errors.push(`cannot find db mapping for domain field name [${domFieldName}]`);
            continue;
         }

         console.log('FETCH table domFieldName:', domFieldName);
         const res = fieldMap.process(domFieldName, req.fields[domFieldName]);
         console.log('FETCH table res:', res);
         if (res !== undefined) {
            const tableName = res.tablename;

            let tbFields = fieldsToSelect.get(tableName);
            if (tbFields === undefined) {
               tbFields = new Set();
               fieldsToSelect.set(tableName, tbFields);
            }
            for (const fieldname of res.fieldnames.children) {
               tbFields.add({
                  rootDomainFieldname: res.fieldnames.rootDomain,
                  domainFieldname: fieldname.domain,
                  fieldnameAlias: createSqlAlias(tableName, fieldname.db),
                  fieldSelectInstruction: createRequestFullFieldName(tableName, fieldname.db),
                  fieldname: fieldname.db,
                  filters: [],
                  joins: [...res.joins],
                  fieldMapper: fieldMap,
               });
            }
         }
      }
      //   console.log('fieldsToSelect:', fieldsToSelect);
      //   console.log('errors:', errors);

      // if primary key not selected for this main table => add it
      const pkToAdd = Table.createAndAddPrimaryKey(tableDef, mapping, req, fieldsToSelect);

      const fieldsToMapResults = new Map<
         string, // fieldnameAlias
         {
            domainFieldname: string;
            rootDomainFieldname: string;
            fieldMapper: FieldMapping;
         }
      >();
      const fields: string[] = [];
      const joins: Set<string> = new Set();
      for (const [key, value] of fieldsToSelect) {
         Array.from(value).forEach((v) => {
            fields.push(v.fieldSelectInstruction);
            v.joins.forEach((v) => joins.add(v));
            fieldsToMapResults.set(v.fieldnameAlias, {
               rootDomainFieldname: v.rootDomainFieldname,
               domainFieldname: v.domainFieldname,
               fieldMapper: v.fieldMapper,
            });
         });
         if (key === tableDef.name) {
            // Array.from(value).forEach((v) => fields.push(v.fullfieldname));
         } else {
            // process this table to join with
            // if 1to1 relationship => add to join
            // else => do another request
         }
      }

      const results: DomainResult = {
         domainName: req.name,
         results: [],
         report: { requests: [] },
         total: 0,
      };
      const joinsSql = joins.size > 0 ? [...joins].join('\n') : '';
      // 1. COUNT SELECT
      const reqCountSql = `SELECT COUNT(${tableDef.name}.${pkToAdd.fieldname}) AS total
 FROM ${tableDef.name}
 ${joinsSql}`;
      //   console.log(reqCountSql);
      const { res: resCount, report: reportCount } = await executeRequest(select, reqCountSql);
      const total = resCount.length > 0 ? Number.parseInt(resCount[0].total as string) : 0;
      results.total = total;
      results.report.requests.push(reportCount);

      // 2. SELECT fields + 1to1
      const reqSql = `SELECT ${fields.join(', ')}
 FROM ${tableDef.name}
 ${joinsSql}
 LIMIT ${req.options.pagination.offset},${req.options.pagination.limit}`;

      //   console.log(reqSql);
      const { res: dbResults, report } = await executeRequest(select, reqSql);
      //   console.log('res:', dbResults);
      //   console.log('report:', report);
      results.report.requests.push(report);

      for (const dbRecord of dbResults) {
         // ids.push(dbRecord[pk].toString());
         const result = createResultAndPopulate(dbRecord, fieldsToMapResults);
         results.results.push(result);
      }
      return Promise.resolve(results);
   }

   private static createAndAddPrimaryKey<DRN extends string, T>(
      tableDef: TableDef,
      mapping: TableMapping<Extract<keyof T, string>>,
      req: DomainRequest<DRN, T>,
      fieldsToSelect: Map<string, Set<TheMonster>>,
   ): TheMonster {
      const pkFieldMap = mapping[req.naturalKey[0]];
      if (pkFieldMap === undefined) {
         throw new Error(`cannot find db mapping for domain field name [${req.naturalKey[0]}]`);
      }
      const pkToAdd: TheMonster = {
         domainFieldname: req.naturalKey[0],
         rootDomainFieldname: req.naturalKey[0],
         fieldnameAlias: createSqlAlias(tableDef.name, tableDef.primaryKey),
         fieldSelectInstruction: createRequestFullFieldName(tableDef.name, tableDef.primaryKey),
         fieldname: tableDef.primaryKey,
         filters: [],
         joins: [],
         fieldMapper: pkFieldMap,
      };
      let tbFields = fieldsToSelect.get(tableDef.name);
      if (tbFields === undefined) {
         tbFields = new Set();
         tbFields.add(pkToAdd);
         fieldsToSelect.set(tableDef.name, tbFields);
      } else {
         let found = false;
         for (const v of tbFields.values()) {
            if (v.fieldSelectInstruction === pkToAdd.fieldSelectInstruction) {
               found = true;
               break;
            }
         }
         if (!found) {
            tbFields.add(pkToAdd);
         }
      }
      return pkToAdd;
   }
}

type TheMonster = {
   rootDomainFieldname: string;
   domainFieldname: string;
   fieldname: string;
   fieldnameAlias: string;
   fieldSelectInstruction: string;
   filters: string[];
   joins: string[];
   fieldMapper: FieldMapping;
};
type FieldsToSelect<Fields> = Map<
   string,
   {
      domainFieldname: Extract<keyof Fields, string>;
      rootDomainFieldname: Extract<keyof Fields, string>;
      fieldMapper: FieldMapping;
   }
>;

function createResultAndPopulate<F>(dbRecord: DbRecord, fieldsToSelect: FieldsToSelect<F>): { [key: string]: string } {
   const result: { [key: string]: string } = {};
   for (const [key, value] of fieldsToSelect) {
      value.fieldMapper.populate(result, value.rootDomainFieldname, value.domainFieldname, dbRecord[key]);
      // result[value.domainFieldname as Extract<keyof F, string>] = value.convertToDomain(dbRecord[key]);
   }
   return result;
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
