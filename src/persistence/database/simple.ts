import { Report, DomainResult } from '../index';
import {
   AndArrayComparison,
   OrArrayComparison,
   Comparison,
   isAndArrayComparison,
   isOrArrayComparison,
   SimpleDomainRequest,
} from '../../DomainRequest';
import { DbRecord, SameTableMapping, SelectMethod, SimpleTableConfig } from './TableConfig';
import { ComparisonOperatorMap, DatabaseOperator, FieldsToSelect, Join } from './types';
import { addFieldToSelect, createNewFieldsToSelect, createSqlAlias, executeRequest } from './functions';

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

   protected async fetchFieldsAndOneToOne(
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
         orderby = `ORDER BY \`${orderBy.fieldname as string}\` ${orderBy.sort}`;
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

         const result = this.createResultToPopulate(dbRecord, fieldsToSelect);

         resultsToReconcile.results.push(result);
      }
      resultsToReconcile.report.requests.push(report);

      return ids;
   }

   protected createResultToPopulate(dbRecord: DbRecord, fieldsToSelect: FieldsToSelect<F>): any {
      const result: any = {};
      for (const key of fieldsToSelect.keys()) {
         const fieldToSelect = fieldsToSelect.get(key);
         const fieldName = fieldToSelect !== undefined ? fieldToSelect.domainFieldname : '';
         result[fieldName] = fieldToSelect?.convertToDomain(dbRecord[key]);
      }
      return result;
   }

   protected getFieldsToSelect<Fields, TableFields extends string>(
      tableConfig: SimpleTableConfig<Fields, TableFields>,
      req: SimpleDomainRequest<DRN, Fields>,
   ): {
      hasSelected: boolean;
      fields: FieldsToSelect<Fields>;
      joins: Join;
   } {
      const fields = createNewFieldsToSelect<Fields>();
      for (const v of req.getFieldsNames()) {
         const mapping = this.getDomainFieldsToTableFieldsMapping(tableConfig, v);

         addFieldToSelect(fields, tableConfig.tableName, mapping.name, v, mapping.convertToDomain);
      }
      return { fields, hasSelected: fields.size > 0, joins: new Map() };
   }

   protected getDomainFieldsToTableFieldsMapping<Fields, TableFields extends string>(
      tableConfig: SimpleTableConfig<Fields, TableFields>,
      key: keyof Fields,
   ): SameTableMapping<TableFields> {
      const mapping: SameTableMapping<TableFields> = tableConfig.domainFieldsToTableFieldsMap[key];
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

   protected async fetchOneToMany(
      resultsToReconcile: DomainResult,
      req: SimpleDomainRequest<DRN, F>,
      ids: string[],
   ): Promise<void> {}
}

function commonFormat(field: string, operator: DatabaseOperator, value: number | string | number[]): string {
   let val: number | string = '';
   if (Array.isArray(value)) {
      if (value.length > 0) {
         val = value[0];
      }
   } else {
      val = value;
   }
   return `${field} ${operator} ${val}`;
}

const comparisonOperatorMap: ComparisonOperatorMap = {
   equals: {
      format: (field: string, value: number | string | number[]): string => commonFormat(field, '=', value),
   },
   greaterThan: {
      format: (field: string, value: number | string | number[]): string => commonFormat(field, '>', value),
   },
   greaterThanOrEquals: {
      format: (field: string, value: number | string | number[]): string => commonFormat(field, '>=', value),
   },
   lesserThan: {
      format: (field: string, value: number | string | number[]): string => commonFormat(field, '<', value),
   },
   lesserThanOrEquals: {
      format: (field: string, value: number | string | number[]): string => commonFormat(field, '<=', value),
   },
   contains: {
      format: (field: string, value: string | number | number[]): string =>
         commonFormat(
            field,
            'LIKE',
            ((value: string | number | number[]) => {
               if (typeof value === 'string' && value.length > 2) {
                  if (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
                     const rawData = value.slice(1, value.length - 1);
                     value = `'%${rawData}%'`;
                  }
               }
               return value;
            })(value),
         ),
   },
   isIn: {
      format: (field: string, value: string | number | number[]): string => {
         return commonFormat(
            field,
            'IN',
            ((value: string | number | number[]) => {
               if (Array.isArray(value)) {
                  return `(${value.join(', ')})`;
               }
               return value;
            })(value),
         );
      },
   },
};
