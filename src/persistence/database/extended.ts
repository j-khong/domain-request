import { Report, DomainResult } from '../index';
import { DomainWithExtendedRequest, SimpleDomainRequest } from '../../DomainRequest';
import { ExtendableTableConfig, ExtendedTableConfig, SelectMethod } from './TableConfig';
import {
   addFieldToSelect,
   createNewFieldsToSelect,
   createRequestFullFieldName,
   createSqlAlias,
   executeRequest,
} from './functions';
import { FieldsToSelect, Join } from './types';
import { SimpleDatabaseTable } from './simple';

export abstract class ExtendableDatabaseTable<DRN extends string, F, E, TF extends string> extends SimpleDatabaseTable<
   DRN,
   F,
   TF
> {
   constructor(protected readonly tableConfig: ExtendableTableConfig<F, E, TF>) {
      super(tableConfig);
   }

   getTableConfig(): ExtendableTableConfig<F, E, TF> {
      return this.tableConfig;
   }

   protected abstract extendedTableConfigToInit(select: SelectMethod): void;

   init(
      select: SelectMethod,
      allDbTables: {
         [Property in DRN]: SimpleDatabaseTable<DRN, F, TF>;
      },
   ): void {
      super.init(select, allDbTables);
      this.extendedTableConfigToInit(select);
   }

   async fetch(req: DomainWithExtendedRequest<DRN, F, E>): Promise<DomainResult> {
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

      await this.fetchExtendedOneToMany(ret, req, ids);

      return ret;
   }

   protected getFieldsToSelect(
      tableConfig: ExtendableTableConfig<F, E, TF>,
      req: DomainWithExtendedRequest<DRN, F, E>,
   ): {
      hasSelected: boolean;
      fields: FieldsToSelect<F>;
   } {
      const res = super.getFieldsToSelect(tableConfig, req);
      if (!res.hasSelected) {
         // check if there is extended fields selected
         for (const key in req.getFields()) {
            if (tableConfig.extendedFieldsToTableFieldsMap[key as unknown as keyof E] !== undefined) {
               if (req.isToSelectOrHasToSelect(key)) {
                  res.hasSelected = true;
                  break;
               }
            }
         }
      }

      return res;
   }

   async fetchExtendedOneToMany(
      resultsToReconcile: DomainResult,
      req: DomainWithExtendedRequest<DRN, F, E>,
      ids: string[],
   ): Promise<void> {
      for (const k in this.tableConfig.extendedFieldsToTableFieldsMap) {
         const conf = this.tableConfig.extendedFieldsToTableFieldsMap[k];

         if (conf.cardinality.name !== 'oneToMany') {
            continue;
         }
         const extendedFieldsToSelect = req.getExtendedFields(k);
         if (extendedFieldsToSelect === undefined) {
            continue;
         }

         const extendedRequest: SimpleDomainRequest<any, any> = req.getExtended()[k];
         const orderBy = extendedRequest.getOptions().orderby;
         let orderField = '';

         const extendedTableConfig = conf.tableConfig as ExtendedTableConfig<any, any>;
         // loop on all fields of table
         const fieldsToSelect = createNewFieldsToSelect<any>();
         for (const subkey in extendedTableConfig.domainFieldsToTableFieldsMap) {
            const map = this.getDomainFieldsToTableFieldsMapping(extendedTableConfig, subkey as any);

            // order by field is not necessarily to select
            if (orderBy !== undefined && orderBy.fieldname === subkey) {
               orderField = `${extendedTableConfig.getTableName(map.name)}.${map.name}`;
            }
            if (extendedTableConfig.isToSelect(extendedFieldsToSelect, subkey)) {
               addFieldToSelect(
                  fieldsToSelect,
                  extendedTableConfig.getTableName(map.name),
                  map.name,
                  subkey,
                  map.convertToDomain,
               );
            }
            // TODO here manage other table mapping
         }

         if (fieldsToSelect.size === 0) {
            continue;
         }

         // process join
         const joins: Join = new Map();
         const mod = extendedTableConfig.getExtandableMapping();
         // const mod = exp[req.getName()];
         const joinTableName = extendedTableConfig.tableName;
         const map = joins.get(joinTableName);
         if (map === undefined) {
            if (mod.cardinality.name === 'oneToOne') {
               joins.set(joinTableName, {
                  relationship: `${mod.tableConfig.tableName}.${mod.tableConfig.tablePrimaryKey}=${joinTableName}.${
                     mod.cardinality.foreignKey as string
                  }`,
                  filters: this.processFilters(extendedTableConfig, extendedRequest),
               });
            }
         }

         const fields = [...Array.from(fieldsToSelect.values()).map((v) => v.fullFieldToSelect)].join(', ');
         const joinsStr: string[] = [];
         for (const [key, value] of joins) {
            joinsStr.push(
               `LEFT JOIN ${key} ON ${value.relationship} ${
                  value.filters.length > 0 ? ` AND (${value.filters.join(' AND ')})` : ''
               }`,
            );
         }
         joinsStr.push(extendedTableConfig.getAdditionalJoin());

         const id = createRequestFullFieldName(this.tableConfig.tableName, this.tableConfig.tablePrimaryKey);
         const pk = createSqlAlias(this.tableConfig.tableName, this.tableConfig.tablePrimaryKey);

         const select = `SELECT ${id}, ${fields}`;
         const from = `FROM ${this.tableConfig.tableName}`;
         const where = `WHERE ${this.tableConfig.tableName}.${this.tableConfig.tablePrimaryKey} IN (${ids.join(', ')})`;

         let orderby = '';
         if (orderBy !== undefined) {
            orderby = `ORDER BY ${orderField} ${orderBy.sort}`;
         }

         const resultsSql = `${select}
${from}
${joinsStr.join('\n')}
${where}
${orderby}
`; // No limit as it can concern different ids, doing the limit in result reconciliation

         const limit = extendedRequest.getOptions().pagination.limit;

         const { res: dbRecords, report } = await executeRequest(this.tableConfig.select, resultsSql);
         resultsToReconcile.report.requests.push(report);

         for (const resourceId of ids) {
            const toPopulate = resultsToReconcile.results.find(
               (d) => d[this.tableConfig.tablePrimaryKey].toString() === resourceId,
            );
            if (toPopulate === undefined) {
               console.log(`big problem, cannot find resource ${this.tableConfig.tableName} of id [${resourceId}]`);
               continue;
            }

            let count = 0;
            const domainPk = createSqlAlias(extendedTableConfig.tableName, extendedTableConfig.tablePrimaryKey);
            const records = dbRecords
               .filter((r) => r[pk].toString() === resourceId && limit > count++)
               .map((r) => {
                  const domain: any = {};
                  for (const [key, value] of fieldsToSelect) {
                     if (domainPk === key) {
                        continue;
                     }
                     domain[value.domainFieldname] = r[key];
                  }
                  return domain;
               });
            toPopulate[k] =
               extendedTableConfig.fromDbRecordsToDomains !== undefined
                  ? extendedTableConfig.fromDbRecordsToDomains(records)
                  : records;
         }
      }
   }
}
