import { DomainResult } from '../index';
import { DomainExpandables, DomainFields, SimpleDomainRequest } from '../../DomainRequest';
import {
   DbRecord,
   DomainExpandableFieldsToTableFields,
   DomainExpandableFieldsToTableFieldsMap,
   ExpandablesTableConfig,
   ExtendableTableConfig,
   ExtendedTableConfig,
   IsExpandablesTableConfig,
   IsExtendableTableConfig,
} from './TableConfig';
import {
   addFieldToSelect,
   createNewFieldsToSelect,
   createRequestFullFieldName,
   createResultAndPopulate,
   createSqlAlias,
   executeRequest,
   getDomainFieldsToTableFieldsMapping,
   getFieldsToSelect,
   processFilters,
} from './functions';
import { FieldsToSelect, Join } from './types';
import { IsExpandable, IsExtended } from 'DomainRequest/addons';

export class AddOnManager {
   private readonly map: Map<string, any>;
   constructor() {
      this.map = new Map();
   }

   setExtended(name: string): void {
      this.map.set(`extended-${name}`, new ExtendedDBAddOn());
   }

   getExtended<DRN extends string, F, E, TF extends string>(name: string): ExtendedDBAddOn<DRN, F, E, TF> {
      const v = this.map.get(`extended-${name}`);
      if (v === undefined) {
         throw new Error(`Database ${name} not initialized with Extended config`);
      }

      return v;
   }

   setExpandables(name: string): void {
      this.map.set(`expandables-${name}`, new ExpandablesDBAddOn());
   }

   getExpandables<DRN extends string, F, E, TF extends string>(name: string): ExpandablesDBAddOn<DRN, F, E, TF> {
      const v = this.map.get(`expandables-${name}`);
      if (v === undefined) {
         throw new Error(`Database ${name} not initialized with Expandables config`);
      }

      return v;
   }
}

class ExtendedDBAddOn<DRN extends string, F, E, TF extends string> {
   checkHasToSelect(
      res: {
         hasSelected: boolean;
         fields: FieldsToSelect<F>;
         joins: Join;
      },
      tableConfig: ExtendableTableConfig<F, E, TF>,
      req: IsExtended<DRN, F, E>,
   ): void {
      if (!res.hasSelected) {
         // check if there is extended fields selected
         for (const key in req.getFields()) {
            if (tableConfig.getExtendedFieldsToTableFieldsMap()[key as unknown as keyof E] !== undefined) {
               if (req.isToSelectOrHasToSelect(key)) {
                  res.hasSelected = true;
                  break;
               }
            }
         }
      }
   }

   async fetchOneToMany(
      tableConfig: IsExtendableTableConfig<E, TF>,
      resultsToReconcile: DomainResult,
      req: IsExtended<DRN, F, E>,
      ids: string[],
   ): Promise<void> {
      for (const k in tableConfig.getExtendedFieldsToTableFieldsMap()) {
         const conf = tableConfig.getExtendedFieldsToTableFieldsMap()[k];

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
            const map = getDomainFieldsToTableFieldsMapping(extendedTableConfig, subkey as any);

            // order by field is not necessarily to select
            if (orderBy !== undefined && orderBy.fieldname === subkey) {
               orderField = `${extendedTableConfig.getTableName(map.name)}.${map.name as string}`;
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
                  filters: processFilters(extendedTableConfig, extendedRequest),
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

         const id = createRequestFullFieldName(tableConfig.getTableName(), tableConfig.getTablePrimaryKey());
         const pk = createSqlAlias(tableConfig.getTableName(), tableConfig.getTablePrimaryKey());

         const select = `SELECT ${id}, ${fields}`;
         const from = `FROM ${tableConfig.getTableName()}`;
         const where = `WHERE ${tableConfig.getTableName()}.${tableConfig.getTablePrimaryKey()} IN (${ids.join(', ')})`;

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

         const { res: dbRecords, report } = await executeRequest(tableConfig.getSelect(), resultsSql);
         resultsToReconcile.report.requests.push(report);

         for (const resourceId of ids) {
            const toPopulate = resultsToReconcile.results.find(
               (d) => d[tableConfig.getTablePrimaryKey()].toString() === resourceId,
            );
            if (toPopulate === undefined) {
               console.log(`big problem, cannot find resource ${tableConfig.getTableName()} of id [${resourceId}]`);
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

class ExpandablesDBAddOn<DRN extends string, F extends DomainFields, E extends DomainExpandables, TF extends string> {
   getFieldsToSelect(
      tableConfig: IsExpandablesTableConfig<F, E, TF>,
      req: IsExpandable<DRN, F, E>,
   ): {
      hasSelected: boolean;
      fields: FieldsToSelect<F>;
      joins: Join;
   } {
      const res: {
         hasSelected: boolean;
         fields: FieldsToSelect<F>;
         joins: Join;
      } = getFieldsToSelect(tableConfig as any, req as any);

      // search expandables 1to1 in tableConfig
      for (const exp in tableConfig.getDomainExpandableFieldsToTableFieldsMap()) {
         const expConf = tableConfig.getDomainExpandableFieldsToTableFieldsMap()[exp];
         // for each
         if (expConf.cardinality.name === 'oneToOne') {
            //   find in req the ones to be requested
            const expandable = req.getExpandables()[exp];
            if (expandable !== undefined && expandable.getFieldsNames().length > 0) {
               const foreignKey = expConf.cardinality.foreignKey;
               // find domain name from foreign key
               let domainName: undefined | Extract<keyof F, string>;
               for (const domainKey in tableConfig.getDomainFieldsToTableFieldsMap()) {
                  if (tableConfig.getDomainFieldsToTableFieldsMap()[domainKey].name === foreignKey) {
                     domainName = domainKey;
                     break;
                  }
               }
               if (domainName === undefined) {
                  throw new Error('investigate, this cannot be undefined');
               }
               // add the foreign key
               res.fields.set(createSqlAlias(tableConfig.getTableName(), foreignKey), {
                  domainFieldname: domainName,
                  fullFieldToSelect: createRequestFullFieldName(tableConfig.getTableName(), foreignKey),
                  convertToDomain: (o: any) => o.toString(),
               });
            }
         }
      }

      return res;
   }

   async fetchOneToOne(
      resultsToReconcile: DomainResult,
      req: IsExpandable<DRN, F, E>,
      tableConfig: IsExpandablesTableConfig<F, E, TF>,
   ): Promise<void> {
      const expandables = req.getExpandables();
      for (const expKey in expandables) {
         const conf = getExpandableTableDetails(tableConfig.getDomainExpandableFieldsToTableFieldsMap(), expKey);
         if (conf.cardinality.name !== 'oneToOne') {
            continue;
         }

         const expandable = expandables[expKey];
         if (expandable.getFieldsNames().length === 0) {
            continue;
         }

         // find the matching DomainName of this key
         let matchingDomainNameToFind: string | undefined;
         for (const key in tableConfig.getDomainFieldsToTableFieldsMap()) {
            if (tableConfig.getDomainFieldsToTableFieldsMap()[key].name === conf.cardinality.foreignKey) {
               matchingDomainNameToFind = key;
               break;
            }
         }
         if (matchingDomainNameToFind === undefined) {
            throw new Error('investigate here');
         }
         const matchingDomainName = matchingDomainNameToFind;

         const deleteValues = req.getFields()[matchingDomainName] === false;
         // dans resultsToReconcile.results, recup les valeur des DomainName id à select
         const values = new Set<string>();
         for (const record of resultsToReconcile.results) {
            values.add(record[matchingDomainName]);
         }

         const requestField = expandable.getId();

         // add the filter
         expandable.setField(requestField, true);
         expandable.setFilter({ key: requestField, operator: 'isIn', value: [...values].join(',') as any });
         expandable.dontSelectCount();

         // const res = await fetch(conf.tableConfig, expandable, false);
         const res = await conf.dbt.fetch(expandable);

         for (const result of res.results) {
            const idValue = result[requestField];
            const toPopulates = resultsToReconcile.results.filter(
               (d) => d[matchingDomainName].toString() === idValue.toString(),
            );
            if (toPopulates.length === 0) {
               console.log(
                  `big problem, cannot find resource ${tableConfig.getTableName()} of id [${idValue as string}]`,
               );
               continue;
            }
            for (const toPopulate of toPopulates) {
               if (toPopulate.expandables === undefined) {
                  toPopulate.expandables = {};
               }

               // add the expandable
               /* eslint-disable @typescript-eslint/no-dynamic-delete */
               delete result[requestField];
               toPopulate.expandables[expandable.getName()] = result;
            }
         }
         resultsToReconcile.report.requests.push(...res.report.requests);

         if (deleteValues) {
            for (const record of resultsToReconcile.results) {
               delete record[matchingDomainName];
            }
         }
      }
   }

   async fetchOneToMany(
      resultsToReconcile: DomainResult,
      req: IsExpandable<DRN, F, E>,
      tableConfig: IsExpandablesTableConfig<F, E, TF>,
      ids: string[],
   ): Promise<void> {
      const expandables = req.getExpandables();
      for (const expKey in expandables) {
         const conf = getExpandableTableDetails(tableConfig.getDomainExpandableFieldsToTableFieldsMap(), expKey);
         if (conf.cardinality.name !== 'oneToMany') {
            continue;
         }

         const expandable = expandables[expKey];
         if (expandable.getFieldsNames().length === 0) {
            continue;
         }

         const expTC = conf.tableConfig as ExpandablesTableConfig<DRN, any, any>;
         // add the field to select mapping the id
         let mainDomainMappingFoundInExpandable: undefined | DomainExpandableFieldsToTableFields<any>;
         for (const mappingKey in expTC.getDomainExpandableFieldsToTableFieldsMap()) {
            const mapping = expTC.getDomainExpandableFieldsToTableFieldsMap()[mappingKey];
            if (mapping.tableConfig.tableName === tableConfig.getTableName()) {
               mainDomainMappingFoundInExpandable = mapping;
               break;
            }
         }
         if (mainDomainMappingFoundInExpandable === undefined) {
            throw new Error(
               `configuration error : no DomainExpandableFieldsToTableFieldsMap for table ${tableConfig.getTableName()}`,
            );
         }
         const cardinality = mainDomainMappingFoundInExpandable.cardinality;
         if (cardinality.name !== 'oneToOne') {
            throw new Error(
               `configuration error : cardinality of ${tableConfig.getTableName()} -> ${tableConfig.getTableName()} should be oneToOne`,
            );
         }
         const fieldToAdd = cardinality.foreignKey;

         // go find the domain Field name mapping this foreign key
         let requestField: undefined | any;
         for (const k in conf.tableConfig.domainFieldsToTableFieldsMap) {
            if (conf.tableConfig.domainFieldsToTableFieldsMap[k].name === fieldToAdd) {
               requestField = k;
               break;
            }
         }
         if (requestField === undefined) {
            throw new Error(
               `configuration error : cannot find "domain to table mapping" for table field [${
                  fieldToAdd as string
               }] in expandable [${expKey}] of domain [${req.getName()}]`,
            );
         }

         // add the filter
         expandable.setField(requestField, true);
         expandable.setFilter({ key: requestField, operator: 'isIn', value: ids.join(',') as any });
         expandable.dontSelectCount();

         // const res = await fetch(conf.tableConfig, expandable, false);
         const res = await conf.dbt.fetch(expandable);

         for (const result of res.results) {
            // find the resource id
            const resourceId = result[requestField];
            const toPopulate = resultsToReconcile.results.find(
               (d) => d[tableConfig.getTablePrimaryKey()] === resourceId,
            );
            if (toPopulate === undefined) {
               console.log(
                  `big problem, cannot find resource ${tableConfig.getTableName()} of id [${resourceId as string}]`,
               );
               continue;
            }
            if (toPopulate.expandables === undefined) {
               toPopulate.expandables = {};
            }
            if (toPopulate.expandables[expandable.getName()] === undefined) {
               toPopulate.expandables[expandable.getName()] = [];
            }

            // add the expandables
            /* eslint-disable @typescript-eslint/no-dynamic-delete */
            delete result[requestField];
            toPopulate.expandables[expandable.getName()].push(result);
         }
         resultsToReconcile.report.requests.push(...res.report.requests);
      }
   }

   createResultAndPopulate(dbRecord: DbRecord, allFieldsToSelect: FieldsToSelect<F>): any {
      return createResultAndPopulate(dbRecord, allFieldsToSelect);
   }
}

function getExpandableTableDetails<ExpandableFields extends DomainExpandables, TableFields extends string>(
   domainExpandableFieldsToTable: DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields>,
   key: keyof ExpandableFields,
): DomainExpandableFieldsToTableFields<TableFields> {
   let tableDetails = domainExpandableFieldsToTable[key];
   if (tableDetails === undefined) {
      for (const k in domainExpandableFieldsToTable) {
         if (
            domainExpandableFieldsToTable[k].globalContextDomainName !== undefined &&
            domainExpandableFieldsToTable[k].globalContextDomainName === key
         ) {
            tableDetails = domainExpandableFieldsToTable[k];
            break;
         }
      }
   }
   return tableDetails;
}
