import { Report, DomainResult } from '../index';
import { DomainExpandables, DomainFields, DomainWithExpandablesRequest } from '../../DomainRequest';
import {
   DbRecord,
   DomainExpandableFieldsToTableFields,
   DomainExpandableFieldsToTableFieldsMap,
   ExpandablesTableConfig,
   SelectMethod,
} from './TableConfig';
import { createNewFieldsToSelect, splitSqlAlias } from './functions';
import { FieldsToSelect, Join } from './types';
import { SimpleDatabaseTable } from './simple';

export abstract class DatabaseTableWithExpandables<
   DRN extends string,
   F,
   E,
   TF extends string,
> extends SimpleDatabaseTable<DRN, F, TF> {
   constructor(protected readonly tableConfig: ExpandablesTableConfig<F, E, TF>) {
      super(tableConfig);
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

   // async fetch(req: DomainWithExpandablesRequest<DRN, F, E>): Promise<DomainResult> {
   //    const results: any[] = [];
   //    const ret = {
   //       domainName: req.getName(),
   //       results,
   //       report: new Report(),
   //       total: 0,
   //    };
   //    // fetch results with
   //    //  fields of the domain
   //    //  expanded fields of oneToOne Domains
   //    const ids = await this.fetchFieldsAndOneToOne(ret, req);
   //    if (ids === undefined) {
   //       return ret;
   //    }

   //    await this.fetchExpandablesOneToMany(ret, req, this.tableConfig, ids);

   //    this.expandablesFieldsToSelectTmpToDel = undefined;
   //    return ret;
   // }

   protected getFieldsToSelect<Fields, Expandables, TableFields extends string>(
      tableConfig: ExpandablesTableConfig<Fields, Expandables, TableFields>,
      req: DomainWithExpandablesRequest<DRN, Fields, Expandables>,
   ): {
      hasSelected: boolean;
      fields: FieldsToSelect<Fields>;
      joins: Join;
   } {
      const res = super.getFieldsToSelect(tableConfig, req);

      const { fieldsToSelect, joins } = this.processOneToOneExpandables(req, tableConfig);

      this.setPrivateTmpVal(fieldsToSelect as any);

      for (const [key, value] of fieldsToSelect) {
         if (res.fields.get(key) !== undefined) {
            throw new Error('investigate here');
         }
         res.fields.set(key, value as any);
      }
      for (const [key, value] of joins) {
         if (res.joins.get(key) !== undefined) {
            throw new Error('investigate here');
         }
         res.joins.set(key, value as any);
      }

      if (!res.hasSelected) {
         res.hasSelected = fieldsToSelect.size > 0;
      }
      return res;
   }

   private processOneToOneExpandables<DRN extends string, F, E, TF extends string>(
      req: DomainWithExpandablesRequest<DRN, F, E>,
      firstTableConfig: ExpandablesTableConfig<F, E, TF>,
   ): {
      fieldsToSelect: FieldsToSelect<E>;
      joins: Join;
   } {
      const domainExpandableFieldsToTable = firstTableConfig.getDomainExpandableFieldsToTableFieldsMap();
      const fieldsToSelect = createNewFieldsToSelect();
      const joins: Join = new Map();
      const expandables = req.getExpandables();
      for (const expKey in expandables) {
         const key = expKey as keyof E;

         //   get from map the table data needed
         const tableDetails = getExpandableTableDetails(domainExpandableFieldsToTable, key);
         if (tableDetails.cardinality.name !== 'oneToOne') {
            continue;
         }

         const expandable = expandables[key];
         if (expandable.getFieldsNames().length === 0) {
            continue;
         }
         //   add the fields to the select list
         const res = super.getFieldsToSelect(tableDetails.tableConfig, expandable as any);
         for (const [key, value] of res.fields) {
            fieldsToSelect.set(key, value as any);
         }

         // process join
         const tableConfig = tableDetails.tableConfig;
         const map = joins.get(tableConfig.tableName);
         if (map === undefined) {
            joins.set(tableConfig.tableName, {
               relationship: `${tableConfig.tableName}.${tableConfig.tablePrimaryKey}=${firstTableConfig.tableName}.${tableDetails.cardinality.foreignKey}`,
               filters: [],
            });
         }

         const filters = this.processFilters(tableConfig, expandable as any);

         if (filters.length > 0) {
            const joinDetails = joins.get(tableConfig.tableName);
            if (undefined !== joinDetails) {
               joinDetails.filters.push(...filters);
            }
         }
      }

      return { fieldsToSelect, joins };
   }

   protected createResultToPopulate(dbRecord: DbRecord, allFieldsToSelect: FieldsToSelect<F>): any {
      if (this.expandablesFieldsToSelectTmpToDel === undefined) {
         throw new Error('investigate, this cannot be undefined');
      }

      // remove expandables fields
      const fieldsToSelect = new Map();
      for (const [key, value] of allFieldsToSelect) {
         if (this.expandablesFieldsToSelectTmpToDel.get(key) === undefined) {
            fieldsToSelect.set(key, value);
         }
      }
      const result = super.createResultToPopulate(dbRecord, fieldsToSelect);

      populateWithOneToOneExpandables(this.tableConfig, result, this.expandablesFieldsToSelectTmpToDel, dbRecord);

      return result;
   }

   private expandablesFieldsToSelectTmpToDel: undefined | FieldsToSelect<E>;
   private setPrivateTmpVal(v: FieldsToSelect<E>): void {
      this.expandablesFieldsToSelectTmpToDel = v;
   }

   protected async fetchOneToMany(
      resultsToReconcile: DomainResult,
      req: DomainWithExpandablesRequest<DRN, F, E>,
      ids: string[],
   ): Promise<void> {
      await fetchExpandablesOneToMany(resultsToReconcile, req, this.tableConfig, ids);

      this.expandablesFieldsToSelectTmpToDel = undefined;
   }
}

function populateWithOneToOneExpandables<F, E, TF extends string>(
   tableConfig: ExpandablesTableConfig<F, E, TF>,
   result: any,
   expandableFieldsToSelect: FieldsToSelect<E>,
   dbRecord: DbRecord,
): void {
   for (const key of expandableFieldsToSelect.keys()) {
      let expandableName = splitSqlAlias(key)[0];

      // block to manage when the expandable name is different from the Domain name
      for (const k in tableConfig.getDomainExpandableFieldsToTableFieldsMap()) {
         const exp = tableConfig.getDomainExpandableFieldsToTableFieldsMap()[k];
         if (exp.tableConfig.tableName === expandableName) {
            expandableName = k;
            continue;
         }
      } // <--

      if (result.expandables === undefined) {
         result.expandables = {};
      }
      if (result.expandables[expandableName] === undefined) {
         result.expandables[expandableName] = {};
      }
      const fieldToSelect = expandableFieldsToSelect.get(key);
      const fieldName = fieldToSelect !== undefined ? fieldToSelect.domainFieldname : '';
      result.expandables[expandableName][fieldName] = fieldToSelect?.convertToDomain(dbRecord[key]);
   }
}

async function fetchExpandablesOneToMany<
   DRN extends string,
   F extends DomainFields,
   E extends DomainExpandables,
   TF extends string,
>(
   resultsToReconcile: DomainResult,
   req: DomainWithExpandablesRequest<DRN, F, E>,
   tableConfig: ExpandablesTableConfig<F, E, TF>,
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
         if (mapping.tableConfig.tableName === tableConfig.tableName) {
            mainDomainMappingFoundInExpandable = mapping;
            break;
         }
      }
      if (mainDomainMappingFoundInExpandable === undefined) {
         throw new Error(
            `configuration error : no DomainExpandableFieldsToTableFieldsMap for table ${tableConfig.tableName}`,
         );
      }
      const cardinality = mainDomainMappingFoundInExpandable.cardinality;
      if (cardinality.name !== 'oneToOne') {
         throw new Error(
            `configuration error : cardinality of ${tableConfig.tableName} -> ${tableConfig.tableName} should be oneToOne`,
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
         const toPopulate = resultsToReconcile.results.find((d) => d[tableConfig.tablePrimaryKey] === resourceId);
         if (toPopulate === undefined) {
            console.log(`big problem, cannot find resource ${tableConfig.tableName} of id [${resourceId as string}]`);
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
