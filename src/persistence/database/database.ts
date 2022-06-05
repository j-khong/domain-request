import { Report, DomainResult } from '../index';
import { DomainFields, DomainExpandables, DomainRequest } from '../../DomainRequest';
import {
   DbRecord,
   DomainExpandableFieldsToTableFieldsMap,
   ExtendableTableConfig,
   isSameTableMapping,
   SelectMethod,
   TableConfig,
} from './TableConfig';
import {
   addFieldToSelect,
   createNewFieldsToSelect,
   createSqlAlias,
   executeRequest,
   fetchExpandablesOneToMany,
   getDomainFieldsToTableFieldsMapping,
   getFieldsToSelect,
   populateWithOneToOneExpandables,
   processFilters,
   processOneToOneExpandables,
} from './functions';
import { FieldsToSelect, Join } from './types';

export abstract class DatabaseTable<DRN extends string, F, E, TF extends string> {
   constructor(protected readonly tableConfig: TableConfig<F, E, TF>) {}

   getTableConfig(): TableConfig<F, E, TF> {
      return this.tableConfig;
   }

   protected abstract buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DRN]: DatabaseTable<DRN, F, E, TF>;
   }): DomainExpandableFieldsToTableFieldsMap<E, TF>;

   protected abstract extendedTableConfigToInit(select: SelectMethod): void;

   init(
      select: SelectMethod,
      allDbTables: {
         [Property in DRN]: DatabaseTable<DRN, F, E, TF>;
      },
   ): void {
      this.tableConfig.init(this.buildDomainExpandableFieldsToTableFieldsMap(allDbTables), select);
      this.extendedTableConfigToInit(select);
   }

   async fetch(req: DomainRequest<DRN, F, E>): Promise<DomainResult> {
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

      await fetchOneToMany(ret, req, this.tableConfig, ids);

      return ret;
   }

   private async fetchFieldsAndOneToOne(
      resultsToReconcile: DomainResult,
      req: DomainRequest<DRN, F, E>,
   ): Promise<string[] | undefined> {
      const fieldsToSelect = getFieldsToSelect(this.tableConfig, req);

      const { fieldsToSelect: expandableFieldsToSelect, joins: expandableJoins } = this.processOneToOneExpandables(req);

      const joins: string[] = [];
      for (const [key, value] of expandableJoins) {
         joins.push(
            `LEFT JOIN ${key} ON ${value.relationship} ${
               value.filters.length > 0 ? ` AND (${value.filters.join(' AND ')})` : ''
            }`,
         );
      }

      if (fieldsToSelect.size === 0 && expandableFieldsToSelect.size === 0) {
         if (!hasSelectedExtended(req, this.tableConfig)) {
            return undefined;
         }
      }
      // add natural key, if not there
      for (const key of req.getNaturalKey()) {
         const mapping = getDomainFieldsToTableFieldsMapping(this.tableConfig, key);
         if (!isSameTableMapping(mapping)) {
            throw new Error(`not a SameTableMapping for key ${key} of ${this.tableConfig.tableName}`);
         }
         addFieldToSelect(
            fieldsToSelect,
            this.tableConfig.tableName,
            this.tableConfig.tablePrimaryKey,
            key,
            mapping.convertToDomain,
         );
      }

      const fields = [
         ...Array.from(fieldsToSelect.values()).map((v) => v.fullFieldToSelect),
         ...Array.from(expandableFieldsToSelect.values()).map((v) => v.fullFieldToSelect),
      ].join(', ');
      const select = `SELECT ${fields}`;

      const from = `FROM ${this.tableConfig.tableName}`;
      const filters = processFilters(this.tableConfig, req);
      const where = filters.length === 0 ? '' : `WHERE ${filters.join(' AND ')}`;

      if (req.isSelectCount()) {
         const resultsCountSql = `SELECT count(${this.tableConfig.tableName}.${
            this.tableConfig.tablePrimaryKey
         }) as total
${from}
${joins.join('\n')}
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
${joins.join('\n')}
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

         this.populateWithOneToOneExpandables(result, expandableFieldsToSelect, dbRecord);

         resultsToReconcile.results.push(result);
      }
      resultsToReconcile.report.requests.push(report);

      return ids;
   }

   protected processOneToOneExpandables(req: DomainRequest<DRN, F, E>): {
      fieldsToSelect: FieldsToSelect<E>;
      joins: Join;
   } {
      const fieldsToSelect = createNewFieldsToSelect();
      const joins: Join = new Map();

      return { fieldsToSelect, joins };
   }

   protected populateWithOneToOneExpandables(
      result: any,
      expandableFieldsToSelect: FieldsToSelect<E>,
      dbRecord: DbRecord,
   ): void {}
}

function hasSelectedExtended<
   Fields extends DomainFields,
   ExpandableFields extends DomainExpandables,
   TableFields extends string,
   Name extends string,
   Extended,
>(
   req: DomainRequest<Name, Fields, ExpandableFields>,
   tableConfig:
      | TableConfig<Fields, ExpandableFields, TableFields>
      | ExtendableTableConfig<Fields, Extended, TableFields>,
): boolean {
   const found = false;
   // if (!isExtendableTableConfig(tableConfig)) {
   //    return false;
   // }

   // for (const key in req.getFields()) {
   //    if (tableConfig.extendedFieldsToTableFieldsMap[key as unknown as keyof Extended] !== undefined) {
   //       if (req.isToSelectOrHasToSelect(key)) {
   //          found = true;
   //          break;
   //       }
   //    }
   // }
   return found;
}

async function fetchOneToMany<Fields, ExpandableFields, TableFields extends string, Name extends string, Extended>(
   resultsToReconcile: DomainResult,
   req: DomainRequest<Name, Fields, ExpandableFields>,
   tableConfig:
      | TableConfig<Fields, ExpandableFields, TableFields>
      | ExtendableTableConfig<Fields, Extended, TableFields>,
   ids: string[],
): Promise<void> {
   if (ids.length === 0) {
      return;
   }

   // searching oneToMany fields which are not expandables
   // if (isExtendableTableConfig(tableConfig)) {
   //    await fetchExtendedOneToMany(resultsToReconcile, req, tableConfig, ids);
   // }

   await fetchExpandablesOneToMany(resultsToReconcile, req, tableConfig as any, ids);
}

// async function fetchExtendedOneToMany<
//    Fields,
//    ExpandableFields,
//    TableFields extends string,
//    Name extends string,
//    Extended,
// >(
//    resultsToReconcile: DomainResult,
//    req: DomainRequest<Name, Fields, ExpandableFields>,
//    tableConfig: ExtendableTableConfig<Fields, Extended, TableFields>,
//    ids: string[],
// ): Promise<void> {
//    for (const k in tableConfig.extendedFieldsToTableFieldsMap) {
//       const conf = tableConfig.extendedFieldsToTableFieldsMap[k];

//       if (!isOtherTableMapping(conf) || conf.cardinality.name !== 'oneToMany') {
//          continue;
//       }
//       const extendedFieldsToSelect = req.getFields()[k as unknown as keyof Fields] as RequestableFields<any>; // TODO fix this cast
//       if (extendedFieldsToSelect === undefined) {
//          continue;
//       }

//       const extendedRequest: DomainRequest<any, any, any> = (req.getExtended() as any)[k];
//       const orderBy = extendedRequest.getOptions().orderby;
//       let orderField = '';

//       // loop on all fields of table
//       const fieldsToSelect = createNewFieldsToSelect<any>();
//       for (const subkey in conf.tableConfig.domainFieldsToTableFieldsMap) {
//          const map = getDomainFieldsToTableFieldsMapping(conf.tableConfig, subkey);
//          if (isSameTableMapping(map)) {
//             // order by field is not necessarily to select
//             if (orderBy !== undefined && orderBy.fieldname === subkey) {
//                orderField = `${conf.tableConfig.getTableName(map.name)}.${map.name}`;
//             }
//             if (conf.tableConfig.isToSelect(extendedFieldsToSelect, subkey)) {
//                addFieldToSelect(
//                   fieldsToSelect,
//                   conf.tableConfig.getTableName(map.name),
//                   map.name,
//                   subkey,
//                   map.convertToDomain,
//                );
//             }
//          } // TODO here manage other table mapping
//       }

//       if (fieldsToSelect.size === 0) {
//          continue;
//       }

//       // process join
//       const joins: Join = new Map();
//       const exp = conf.tableConfig.getDomainExpandableFieldsToTableFieldsMap();
//       const mod = exp[req.getName()];
//       const joinTableName = conf.tableConfig.tableName;
//       const map = joins.get(joinTableName);
//       if (map === undefined) {
//          if (mod.cardinality.name === 'oneToOne') {
//             joins.set(joinTableName, {
//                relationship: `${mod.tableConfig.tableName}.${mod.tableConfig.tablePrimaryKey}=${joinTableName}.${
//                   mod.cardinality.foreignKey as string
//                }`,
//                filters: processFilters(conf.tableConfig, extendedRequest),
//             });
//          }
//       }

//       const fields = [...Array.from(fieldsToSelect.values()).map((v) => v.fullFieldToSelect)].join(', ');
//       const joinsStr: string[] = [];
//       for (const [key, value] of joins) {
//          joinsStr.push(
//             `LEFT JOIN ${key} ON ${value.relationship} ${
//                value.filters.length > 0 ? ` AND (${value.filters.join(' AND ')})` : ''
//             }`,
//          );
//       }
//       joinsStr.push(conf.tableConfig.getAdditionalJoin());

//       const id = createRequestFullFieldName(tableConfig.tableName, tableConfig.tablePrimaryKey);
//       const pk = createSqlAlias(tableConfig.tableName, tableConfig.tablePrimaryKey);

//       const select = `SELECT ${id}, ${fields}`;
//       const from = `FROM ${tableConfig.tableName}`;
//       const where = `WHERE ${tableConfig.tableName}.${tableConfig.tablePrimaryKey} IN (${ids.join(', ')})`;

//       let orderby = '';
//       if (orderBy !== undefined) {
//          orderby = `ORDER BY ${orderField} ${orderBy.sort}`;
//       }

//       const resultsSql = `${select}
// ${from}
// ${joinsStr.join('\n')}
// ${where}
// ${orderby}
// `; // No limit as it can concern different ids, doing the limit in result reconciliation

//       const limit = extendedRequest.getOptions().pagination.limit;

//       const { res: dbRecords, report } = await executeRequest(tableConfig.select, resultsSql);
//       resultsToReconcile.report.requests.push(report);

//       for (const resourceId of ids) {
//          const toPopulate = resultsToReconcile.results.find(
//             (d) => d[tableConfig.tablePrimaryKey].toString() === resourceId,
//          );
//          if (toPopulate === undefined) {
//             console.log(`big problem, cannot find resource ${tableConfig.tableName} of id [${resourceId}]`);
//             continue;
//          }

//          let count = 0;
//          const domainPk = createSqlAlias(conf.tableConfig.tableName, conf.tableConfig.tablePrimaryKey);
//          const records = dbRecords
//             .filter((r) => r[pk].toString() === resourceId && limit > count++)
//             .map((r) => {
//                const domain: any = {};
//                for (const [key, value] of fieldsToSelect) {
//                   if (domainPk === key) {
//                      continue;
//                   }
//                   domain[value.domainFieldname] = r[key];
//                }
//                return domain;
//             });
//          toPopulate[k] =
//             conf.tableConfig.fromDbRecordsToDomains !== undefined
//                ? conf.tableConfig.fromDbRecordsToDomains(records)
//                : records;
//       }
//    }
// }

// function buildOrderBy<F>(o: Options<F>, tableConfig:ExtendedTableConfig<): string {
//    if (o.orderby === undefined) return '';

//    const map = getDomainFieldsToTableFieldsMapping(tableConfig, key);
//    if (isSameTableMapping(map)) {
//       // order by field is not necessarily to select
//       if (o.orderby.fieldname === key) {
//          return createSqlAlias(tableConfig.getTableName(map.name), map.name);
//       }
//    }
//    return '';
// }

export abstract class DatabaseTableWithExpandables<DRN extends string, F, E, TF extends string> extends DatabaseTable<
   DRN,
   F,
   E,
   TF
> {
   protected extendedTableConfigToInit(select: SelectMethod): void {}

   protected processOneToOneExpandables(req: DomainRequest<DRN, F, E>): {
      fieldsToSelect: FieldsToSelect<E>;
      joins: Join;
   } {
      return processOneToOneExpandables(req, this.tableConfig);
   }

   protected populateWithOneToOneExpandables(
      result: any,
      expandableFieldsToSelect: FieldsToSelect<E>,
      dbRecord: DbRecord,
   ): void {
      return populateWithOneToOneExpandables(this.tableConfig, result, expandableFieldsToSelect, dbRecord);
   }
}

export abstract class DatabaseTableWithExtended<DRN extends string, F, TF extends string> extends DatabaseTable<
   DRN,
   F,
   any,
   TF
> {
   protected buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DRN]: DatabaseTable<DRN, F, any, TF>;
   }): DomainExpandableFieldsToTableFieldsMap<any, TF> {
      return {} as any;
   }
}

export abstract class DatabaseTableWithExpandablesAndExtended<
   DRN extends string,
   F,
   E,
   TF extends string,
> extends DatabaseTable<DRN, F, E, TF> {
   protected processOneToOneExpandables(req: DomainRequest<DRN, F, E>): {
      fieldsToSelect: FieldsToSelect<E>;
      joins: Join;
   } {
      return processOneToOneExpandables(req, this.tableConfig);
   }

   protected populateWithOneToOneExpandables(
      result: any,
      expandableFieldsToSelect: FieldsToSelect<E>,
      dbRecord: DbRecord,
   ): void {
      return populateWithOneToOneExpandables(this.tableConfig, result, expandableFieldsToSelect, dbRecord);
   }
}
