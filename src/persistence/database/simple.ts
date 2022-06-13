import { Report, DomainResult } from '../index';
import { SimpleDomainRequest } from '../../DomainRequest';
import { DbRecord, SelectMethod, SimpleTableConfig } from './TableConfig';
import { FieldsToSelect, Join } from './types';
import {
   addFieldToSelect,
   createResultAndPopulate,
   createSqlAlias,
   executeRequest,
   getDomainFieldsToTableFieldsMapping,
   getFieldsToSelect,
   processFilters,
} from './functions';

export abstract class SimpleDatabaseTable<DRN extends string, F, TF extends string> {
   constructor(protected readonly tableConfig: SimpleTableConfig<F, TF>) {}

   getTableConfig(): SimpleTableConfig<F, TF> {
      return this.tableConfig;
   }

   init(
      select: SelectMethod,
      allDbTables: {
         [Property in DRN]: SimpleDatabaseTable<DRN, F, TF>;
      },
   ): void {
      this.tableConfig.init(select);
   }

   async fetch(req: SimpleDomainRequest<DRN, F>): Promise<DomainResult> {
      const results: any[] = [];
      const ret = {
         domainName: req.getName(),
         results,
         report: new Report(),
         total: 0,
      };
      // fetch results with
      //  fields of the domain
      //  expanded fields of oneToOne Domains
      const ids = await this.fetchFieldsAndOneToOne(ret, req);
      if (ids === undefined || ids.length === 0) {
         return ret;
      }

      await this.fetchOneToMany(ret, req, ids);
      return ret;
   }

   private async fetchFieldsAndOneToOne(
      resultsToReconcile: DomainResult,
      req: SimpleDomainRequest<DRN, F>,
   ): Promise<string[] | undefined> {
      const { fields: fieldsToSelect, hasSelected, joins } = this.getFieldsToSelect(this.tableConfig, req);

      const joinsStr: string[] = [];
      for (const [key, value] of joins) {
         joinsStr.push(
            `LEFT JOIN ${key} ON ${value.relationship} ${
               value.filters.length > 0 ? ` AND (${value.filters.join(' AND ')})` : ''
            }`,
         );
      }

      if (!hasSelected) {
         return undefined;
      }

      // add natural key, if not there
      for (const key of req.getNaturalKey()) {
         const mapping = getDomainFieldsToTableFieldsMapping(this.tableConfig, key);

         addFieldToSelect(
            fieldsToSelect,
            this.tableConfig.tableName,
            this.tableConfig.tablePrimaryKey,
            key,
            mapping.convertToDomain,
         );
      }

      const fields = [...Array.from(fieldsToSelect.values()).map((v) => v.fullFieldToSelect)].join(', ');
      const select = `SELECT ${fields}`;

      const from = `FROM ${this.tableConfig.tableName}`;
      const filters = processFilters(this.tableConfig, req);
      const where = filters.length === 0 ? '' : `WHERE ${filters.join(' AND ')}`;

      if (req.isSelectCount()) {
         const resultsCountSql = `SELECT count(${this.tableConfig.tableName}.${
            this.tableConfig.tablePrimaryKey
         }) as total
 ${from}
 ${joinsStr.join('\n')}
 ${where}`;
         const { res: resCount, report } = await executeRequest(this.tableConfig.select, resultsCountSql);
         resultsToReconcile.total = Number.parseInt(resCount[0].total as any);
         resultsToReconcile.report.requests.push(report);
      }

      let orderby = '';
      const orderBy = req.getOptions().orderby;
      if (orderBy !== undefined) {
         const mapping = getDomainFieldsToTableFieldsMapping(this.tableConfig, orderBy.fieldname);
         orderby = `ORDER BY ${this.tableConfig.tableName}.${mapping.name} ${orderBy.sort}`;
      }

      const resultsSql = `${select}
 ${from}
 ${joinsStr.join('\n')}
 ${where}
 ${orderby}
 LIMIT ${req.getOptions().pagination.offset},${req.getOptions().pagination.limit}`;

      const { res: dbResults, report } = await executeRequest(this.tableConfig.select, resultsSql);
      const ids: string[] = [];
      const pk = createSqlAlias(this.tableConfig.tableName, this.tableConfig.tablePrimaryKey);
      for (const dbRecord of dbResults) {
         ids.push(dbRecord[pk].toString());

         const result = this.createResultAndPopulate(dbRecord, fieldsToSelect);

         resultsToReconcile.results.push(result);
      }
      resultsToReconcile.report.requests.push(report);

      return ids;
   }

   protected createResultAndPopulate(dbRecord: DbRecord, fieldsToSelect: FieldsToSelect<F>): any {
      return createResultAndPopulate(dbRecord, fieldsToSelect);
   }

   protected getFieldsToSelect(
      tableConfig: SimpleTableConfig<F, TF>,
      req: SimpleDomainRequest<DRN, F>,
   ): {
      hasSelected: boolean;
      fields: FieldsToSelect<F>;
      joins: Join;
   } {
      return getFieldsToSelect(tableConfig, req);
   }

   protected async fetchOneToMany(
      resultsToReconcile: DomainResult,
      req: SimpleDomainRequest<DRN, F>,
      ids: string[],
   ): Promise<void> {}
}
