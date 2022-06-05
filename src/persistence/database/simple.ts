import { Report, DomainResult } from '../index';
import {
   AndArrayComparison,
   OrArrayComparison,
   Comparison,
   isAndArrayComparison,
   isOrArrayComparison,
   SimpleDomainRequest,
} from '../../DomainRequest';
import { SameTableMapping, SelectMethod, SimpleTableConfig } from './TableConfig';
import { FieldsToSelect } from './types';
import {
   addFieldToSelect,
   comparisonOperatorMap,
   createNewFieldsToSelect,
   createSqlAlias,
   executeRequest,
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
      if (ids === undefined) {
         return ret;
      }

      return ret;
   }

   protected async fetchFieldsAndOneToOne(
      resultsToReconcile: DomainResult,
      req: SimpleDomainRequest<DRN, F>,
   ): Promise<string[] | undefined> {
      const { fields: fieldsToSelect, hasSelected } = this.getFieldsToSelect(this.tableConfig, req);

      if (!hasSelected) {
         return undefined;
      }
      // add natural key, if not there
      for (const key of req.getNaturalKey()) {
         const mapping = this.getDomainFieldsToTableFieldsMapping(this.tableConfig, key);

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
      const filters = this.processFilters(this.tableConfig, req);
      const where = filters.length === 0 ? '' : `WHERE ${filters.join(' AND ')}`;

      if (req.isSelectCount()) {
         const resultsCountSql = `SELECT count(${this.tableConfig.tableName}.${this.tableConfig.tablePrimaryKey}) as total
 ${from}
 ${where}`;
         const { res: resCount, report } = await executeRequest(this.tableConfig.select, resultsCountSql);
         resultsToReconcile.total = Number.parseInt(resCount[0].total as any);
         resultsToReconcile.report.requests.push(report);
      }

      let orderby = '';
      const orderBy = req.getOptions().orderby;
      if (orderBy !== undefined) {
         orderby = `ORDER BY \`${orderBy.fieldname as string}\` ${orderBy.sort}`;
      }

      const resultsSql = `${select}
 ${from}
 ${where}
 ${orderby}
 LIMIT ${req.getOptions().pagination.offset},${req.getOptions().pagination.limit}`;

      const { res: dbResults, report } = await executeRequest(this.tableConfig.select, resultsSql);
      const ids: string[] = [];
      const pk = createSqlAlias(this.tableConfig.tableName, this.tableConfig.tablePrimaryKey);
      for (const dbRecord of dbResults) {
         ids.push(dbRecord[pk].toString());

         const result: any = {};
         for (const key of fieldsToSelect.keys()) {
            const fieldToSelect = fieldsToSelect.get(key);
            const fieldName = fieldToSelect !== undefined ? fieldToSelect.domainFieldname : '';
            result[fieldName] = fieldToSelect?.convertToDomain(dbRecord[key]);
         }

         resultsToReconcile.results.push(result);
      }
      resultsToReconcile.report.requests.push(report);

      return ids;
   }

   protected getFieldsToSelect(
      tableConfig: SimpleTableConfig<F, TF>,
      req: SimpleDomainRequest<DRN, F>,
   ): {
      hasSelected: boolean;
      fields: FieldsToSelect<F>;
   } {
      const fields = createNewFieldsToSelect<F>();
      for (const v of req.getFieldsNames()) {
         const mapping = this.getDomainFieldsToTableFieldsMapping(tableConfig, v);

         addFieldToSelect(fields, tableConfig.tableName, mapping.name, v, mapping.convertToDomain);
      }
      return { fields, hasSelected: fields.size > 0 };
   }

   protected getDomainFieldsToTableFieldsMapping(
      tableConfig: SimpleTableConfig<F, TF>,
      key: keyof F,
   ): SameTableMapping<TF> {
      const mapping: SameTableMapping<TF> = tableConfig.domainFieldsToTableFieldsMap[key];
      if (mapping === undefined) {
         throw new Error(`configuration problem: no field [${key as string}] in domain to db field mapping`);
      }

      return mapping;
   }

   protected processFilters(tableConfig: SimpleTableConfig<F, TF>, req: SimpleDomainRequest<DRN, F>): string[] {
      const filters = req.getFilters();
      const result: string[] = [];

      for (const key in filters) {
         const fieldMapper = this.getDomainFieldsToTableFieldsMapping(tableConfig, key);
         const comparison = filters[key];
         if (comparison === undefined) {
            continue;
         }

         const populateValue = (c: Comparison<F>, result: string[]): void => {
            const comparisonMapper = comparisonOperatorMap[c.operator];
            result.push(
               comparisonMapper.format(
                  `${tableConfig.tableName}.${fieldMapper.name}`,
                  fieldMapper.convertToDb(c.value),
               ),
            );
         };
         const populateFromArray = (arr: Array<Comparison<F>>, result: string[], link: 'AND' | 'OR'): void => {
            if (arr !== undefined && arr.length > 0) {
               const res: string[] = [];
               for (const comp of arr) {
                  populateValue(comp, res);
               }
               result.push(`(${res.join(` ${link} `)})`);
            }
         };
         const populate = (c: AndArrayComparison<F> | OrArrayComparison<F>): void => {
            if (isAndArrayComparison(c)) {
               populateFromArray(c.and as Array<Comparison<F>>, result, 'AND');
            } else if (isOrArrayComparison(c)) {
               populateFromArray(c.or as Array<Comparison<F>>, result, 'OR');
            }
         };

         populate(comparison);
      }

      return result;
   }
}
