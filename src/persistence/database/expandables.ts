import { DomainResult, Report } from '../index.ts';
import { DomainWithExpandablesRequest, SimpleDomainRequest } from '../../DomainRequest/index.ts';
import {
   DbRecord,
   DomainExpandableFieldsToTableFieldsMap,
   ExpandablesTableConfig,
   SelectMethod,
   SimpleTableConfig,
} from './TableConfig.ts';
import { FieldsToSelect, Join } from './types.ts';
import { SimpleDatabaseTable } from './simple.ts';
import { AddOnManager, getExpandableTableDetails } from './addons.ts';
import { executeRequest, processFilters, getDomainFieldsToTableFieldsMapping } from './functions.ts';

export abstract class DatabaseTableWithExpandables<
   DRN extends string,
   F,
   E,
   TF extends string,
> extends SimpleDatabaseTable<DRN, F, TF> {
   private readonly addonManager: AddOnManager;
   constructor(protected readonly tableConfig: ExpandablesTableConfig<F, E, TF>) {
      super(tableConfig);

      this.addonManager = new AddOnManager();
      this.addonManager.setExpandables(tableConfig.tableName);
   }

   getTableConfig(): ExpandablesTableConfig<F, E, TF> {
      return this.tableConfig;
   }

   protected abstract buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DRN]: SimpleDatabaseTable<DRN, F, TF>;
   }): DomainExpandableFieldsToTableFieldsMap<E, TF>;

   init(
      select: SelectMethod,
      allDbTables: {
         [Property in DRN]: SimpleDatabaseTable<DRN, F, TF>;
      },
   ): void {
      this.tableConfig.init(select, this.buildDomainExpandableFieldsToTableFieldsMap(allDbTables));
   }

   fetch(req: DomainWithExpandablesRequest<DRN, F, E>): Promise<DomainResult> {
      const f = this.getFilterByExpandable(req, this.tableConfig);
      if (f !== undefined) {
         return this.filterByExpandable(req, [{ req, tc: this.tableConfig }, ...f]);
      } else {
         return super.fetch(req);
      }
   }

   /**
    *
    * Search the first filter found through the expandables of the request
    * and return all requests down that path
    */
   private getFilterByExpandable(
      req: DomainWithExpandablesRequest<DRN, F, E>,
      tc: ExpandablesTableConfig<F, E, TF>,
   ): Array<{ req: SimpleDomainRequest<DRN, F>; tc: SimpleTableConfig<F, TF> }> | undefined {
      let next = undefined;

      const expandables = req.getExpandables();
      for (const d in expandables) {
         const expandableMapping = tc.getDomainExpandableFieldsToTableFieldsMap();
         const conf = getExpandableTableDetails(expandableMapping, d);
         next = conf.tableConfig;

         const expandable = expandables[d];
         if (Object.keys(expandable.getFilters()).length > 0) {
            return [{ req: expandable, tc: next }];
         }

         if ((expandable as any).getExpandables !== undefined) {
            const res = this.getFilterByExpandable(
               expandable as DomainWithExpandablesRequest<DRN, F, E>,
               next as ExpandablesTableConfig<F, E, TF>,
            );
            if (res !== undefined) {
               return [{ req: expandable, tc: next }, ...res];
            }
         }
      }
      return undefined;
   }

   /**
    *
    * Special fetch case : select on the expandable with filter and join on related tables
    *
    */
   private async filterByExpandable(
      req: DomainWithExpandablesRequest<DRN, F, E>,
      // values: Array<{ req: any; tc: any }>,
      values: Array<{ req: SimpleDomainRequest<DRN, F>; tc: SimpleTableConfig<F, TF> }>,
   ): Promise<DomainResult> {
      const results: any[] = [];
      const ret = {
         domainName: req.getName(),
         results,
         report: new Report(),
         total: 0,
      };

      // get the first expandable which has filters
      // - make the join request on all resources up the path
      // - make the one to many requests down the path

      let count = 0;
      const fieldsInst: string[] = [];
      let fieldForTotalCount = '';
      const allFieldsToSelect: Array<{ req: SimpleDomainRequest<DRN, F>; fieldsToSelect: FieldsToSelect<F> }> = [];
      const joins: string[] = [];
      const reversed = [...values].reverse();

      const getFieldToSelect = (current: {
         req: SimpleDomainRequest<DRN, F>;
         tc: SimpleTableConfig<F, TF>;
      }): FieldsToSelect<F> => {
         if ((current.req as any).getExpandables !== undefined) {
            const { fields } = this.getFieldsToSelect(
               current.tc as ExpandablesTableConfig<F, E, TF>,
               current.req as DomainWithExpandablesRequest<DRN, F, E>,
            );
            return fields;
         } else {
            const { fields } = super.getFieldsToSelect(current.tc, current.req);
            return fields;
         }
      };

      for (const current of reversed) {
         const fieldsToSelect = getFieldToSelect(current);

         allFieldsToSelect.push({ fieldsToSelect, req: current.req });
         for (const [key, value] of fieldsToSelect) {
            fieldsInst.push(value.fullFieldToSelect);
         }
         if (count < reversed.length - 1) {
            const next = reversed[count + 1];
            const expa = (next.tc as any).getDomainExpandableFieldsToTableFieldsMap();
            if (expa !== undefined) {
               const conf = getExpandableTableDetails(expa, current.req.getName());
               if (conf.cardinality.name === 'oneToOne') {
                  joins.push(
                     `JOIN ${next.tc.tableName} ON ${next.tc.tableName}.${conf.cardinality.foreignKey} = ${current.tc.tableName}.${current.tc.tablePrimaryKey}`,
                  );
               }
            }
         }
         count++;
      }
      const filters: string[] = [];
      if (values.length > 0) {
         const last = values[values.length - 1];
         const fromTable = last.tc.tableName;

         fieldForTotalCount = `${last.tc.tableName}.${last.tc.tablePrimaryKey}`;
         filters.push(...processFilters(last.tc, last.req));

         const select = `SELECT ${fieldsInst.join(', ')}`;
         const from = `FROM ${fromTable}`;
         const joinsStr = joins.join('\n');
         const where = filters.length === 0 ? '' : `WHERE ${filters.join(' AND ')}`;

         const resultsCountSql = `SELECT count(${fieldForTotalCount}) as total
${from}
${joinsStr}
${where}`;

         const { res: resCount, report } = await executeRequest(this.tableConfig.select, resultsCountSql);
         const total = resCount.length > 0 ? Number.parseInt(resCount[0].total as string) : 0;
         ret.total = total;
         ret.report.requests.push(report);

         let orderby = '';
         const orderBy = last.req.getOptions().orderby;
         if (orderBy !== undefined) {
            const mapping = getDomainFieldsToTableFieldsMapping<any, string>(last.tc, orderBy.fieldname);
            orderby = `ORDER BY ${last.tc.tableName}.${mapping.name} ${orderBy.sort}`;
         }

         const resultsSql = `${select}
         ${from}
         ${joinsStr}
         ${where}
         ${orderby}
         LIMIT ${last.req.getOptions().pagination.offset},${last.req.getOptions().pagination.limit}`;

         const { res: dbResults, report: report2 } = await executeRequest(this.tableConfig.select, resultsSql);

         const allFieldsReversed = allFieldsToSelect.reverse();
         for (const dbRecord of dbResults) {
            const result = this.createDeepResultAndPopulate(dbRecord, allFieldsReversed);
            ret.results.push(result);
         }
         ret.report.requests.push(report2);
      }
      return ret;
   }

   private createDeepResultAndPopulate(
      dbRecord: DbRecord,
      allFieldsToSelect: Array<{ req: SimpleDomainRequest<DRN, F>; fieldsToSelect: FieldsToSelect<F> }>,
   ): { [key: string]: string } {
      const ret: any = { result: {} };
      let result = ret.result;
      let count = 0;
      for (const domainSet of allFieldsToSelect) {
         const { fieldsToSelect, req } = domainSet;
         const res = this.createResultAndPopulate(dbRecord, fieldsToSelect);

         if (count === 0) {
            ret.result = res;
            result = ret.result;
         } else {
            result.expandables = {};
            result.expandables[req.getName()] = { fields: res };
            result = result.expandables[req.getName()];
         }

         count++;
      }
      return ret.result;
   }

   protected getFieldsToSelect(
      tableConfig: ExpandablesTableConfig<F, E, TF>,
      req: DomainWithExpandablesRequest<DRN, F, E>,
   ): {
      hasSelected: boolean;
      fields: FieldsToSelect<F>;
      joins: Join;
   } {
      return this.addonManager
         .getExpandables<DRN, F, E, TF>(this.tableConfig.tableName)
         .getFieldsToSelect(tableConfig, req);
   }

   protected createResultAndPopulate(dbRecord: DbRecord, allFieldsToSelect: FieldsToSelect<F>): any {
      return this.addonManager
         .getExpandables<DRN, F, E, TF>(this.tableConfig.tableName)
         .createResultAndPopulate(dbRecord, allFieldsToSelect);
   }

   protected async fetchOneToMany(
      resultsToReconcile: DomainResult,
      req: DomainWithExpandablesRequest<DRN, F, E>,
      ids: string[],
   ): Promise<void> {
      const addon = this.addonManager.getExpandables<DRN, F, E, TF>(this.tableConfig.tableName);

      await addon.fetchOneToOne(resultsToReconcile, req, this.tableConfig);
      await addon.fetchOneToMany(resultsToReconcile, req, this.tableConfig, ids);
   }
}
