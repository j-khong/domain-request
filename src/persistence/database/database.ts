import { Report, DomainResult } from '../index';
import {
   DomainFields,
   DomainExpandables,
   DomainRequest,
   Operator,
   RequestableFields,
   AndArrayComparison,
   OrArrayComparison,
   Comparison,
   isAndArrayComparison,
   isOrArrayComparison,
} from '../../DomainRequest';
import {
   DbRecord,
   DomainExpandableFieldsToTableFields,
   DomainExpandableFieldsToTableFieldsMap,
   ExtendableTableConfig,
   isExtendableTableConfig,
   isOtherTableMapping,
   isSameTableMapping,
   OtherTableMapping,
   SameTableMapping,
   SelectMethod,
   SelectMethodResult,
   TableConfig,
} from './types';

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
      const fieldsToSelect = this.getFieldsToSelect(this.tableConfig, req);

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
         addFieldToSelect(fieldsToSelect, this.tableConfig.tableName, this.tableConfig.tablePrimaryKey, key);
      }

      const fields = [
         ...Array.from(fieldsToSelect.values()).map((v) => v.fullFieldToSelect),
         ...Array.from(expandableFieldsToSelect.values()).map((v) => v.fullFieldToSelect),
      ].join(', ');
      const select = `SELECT ${fields}`;

      const from = `FROM ${this.tableConfig.tableName}`;
      const filters = this.processFilters(this.tableConfig, req);
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
         orderby = `ORDER BY ${orderBy.fieldname as string} ${orderBy.sort}`;
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
            result[fieldName] = dbRecord[key]; // TODO do a mapping, just as done with extended (to manageg boolean for example)
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
      // const expandables = req.getExpandables();
      // for (const expKey in expandables) {
      //    const key = expKey as keyof E;

      //    //   get from map the table data needed
      //    const tableDetails = getTableDetails(domainExpandableFieldsToTable, key);
      //    if (tableDetails.cardinality.name !== 'oneToOne') {
      //       continue;
      //    }

      //    const expandable = expandables[key];
      //    if (expandable.getFieldsNames().length === 0) {
      //       continue;
      //    }
      //    //   add the fields to the select list
      //    const res = this.getFieldsToSelect(tableDetails.tableConfig, expandable);
      //    for (const [key, value] of res) {
      //       fieldsToSelect.set(key, value as any);
      //    }

      //    // process join
      //    const tableConfig = tableDetails.tableConfig;
      //    const map = joins.get(tableConfig.tableName);
      //    if (map === undefined) {
      //       joins.set(tableConfig.tableName, {
      //          relationship: `${tableConfig.tableName}.${tableConfig.tablePrimaryKey}=${table.tableName}.${tableDetails.cardinality.foreignKey}`,
      //          filters: [],
      //       });
      //    }

      //    const filters = this.processFilters(tableConfig, expandable as any);

      //    if (filters.length > 0) {
      //       const joinDetails = joins.get(tableConfig.tableName);
      //       if (undefined !== joinDetails) {
      //          joinDetails.filters.push(...filters);
      //       }
      //    }
      // }

      return { fieldsToSelect, joins };
   }

   protected populateWithOneToOneExpandables(
      result: any,
      expandableFieldsToSelect: FieldsToSelect<E>,
      dbRecord: DbRecord,
   ): void {}

   // under : can be functions outside class

   protected processFilters<Fields, ExpandableFields, TableFields extends string, Name extends string>(
      tableConfig: TableConfig<Fields, ExpandableFields, TableFields>,
      req: DomainRequest<Name, Fields, ExpandableFields>,
   ): string[] {
      const filters = req.getFilters();
      const result: string[] = [];

      for (const key in filters) {
         const fieldMapper = getDomainFieldsToTableFieldsMapping(tableConfig, key);
         if (isOtherTableMapping(fieldMapper)) {
            // don't manage filtering yet
            continue;
         }
         const comparison = filters[key];
         if (comparison === undefined) {
            continue;
         }

         const populateValue = (c: Comparison<Fields>, result: string[]): void => {
            const comparisonMapper = comparisonOperatorMap[c.operator];
            result.push(
               comparisonMapper.format(`${tableConfig.tableName}.${fieldMapper.name}`, fieldMapper.convert(c.value)),
            );
         };
         const populateFromArray = (arr: Array<Comparison<Fields>>, result: string[], link: 'AND' | 'OR'): void => {
            if (arr !== undefined && arr.length > 0) {
               const res: string[] = [];
               for (const comp of arr) {
                  populateValue(comp, res);
               }
               result.push(`(${res.join(` ${link} `)})`);
            }
         };
         const populate = (c: AndArrayComparison<Fields> | OrArrayComparison<Fields>): void => {
            if (isAndArrayComparison(c)) {
               populateFromArray(c.and as Array<Comparison<Fields>>, result, 'AND');
            } else if (isOrArrayComparison(c)) {
               populateFromArray(c.or as Array<Comparison<Fields>>, result, 'OR');
            }
         };

         populate(comparison);
      }

      return result;
   }

   protected getFieldsToSelect<Fields, ExpandableFields, TableFields extends string, Name extends string>(
      tableConfig: TableConfig<Fields, ExpandableFields, TableFields>,
      req: DomainRequest<Name, Fields, ExpandableFields>,
   ): FieldsToSelect<Fields> {
      const fieldsToSelect = createNewFieldsToSelect<Fields>();
      for (const v of req.getFieldsNames()) {
         const mapping = getDomainFieldsToTableFieldsMapping(tableConfig, v);
         if (isSameTableMapping(mapping)) {
            addFieldToSelect(fieldsToSelect, tableConfig.tableName, mapping.name, v);
         }
      }
      return fieldsToSelect;
   }
}

async function executeRequest(
   select: SelectMethod,
   sql: string,
): Promise<{
   res: SelectMethodResult;
   report: {
      sql: string;
      timeInMs: number;
   };
}> {
   const start = new Date();
   const res = await select(sql);
   const end = new Date();
   const report = {
      sql: sql,
      timeInMs: end.getTime() - start.getTime(),
   };
   return { res, report };
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
      | ExtendableTableConfig<Fields, TableFields, Extended>,
): boolean {
   let found = false;
   if (!isExtendableTableConfig(tableConfig)) {
      return false;
   }

   for (const key in req.getFields()) {
      if (tableConfig.extendedFieldsToTableFieldsMap[key as unknown as keyof Extended] !== undefined) {
         if (req.isToSelectOrHasToSelect(key)) {
            found = true;
            break;
         }
      }
   }
   return found;
}

async function fetchOneToMany<Fields, ExpandableFields, TableFields extends string, Name extends string, Extended>(
   resultsToReconcile: DomainResult,
   req: DomainRequest<Name, Fields, ExpandableFields>,
   tableConfig:
      | TableConfig<Fields, ExpandableFields, TableFields>
      | ExtendableTableConfig<Fields, TableFields, Extended>,
   ids: string[],
): Promise<void> {
   if (ids.length === 0) {
      return;
   }

   // searching oneToMany fields which are not expandables
   if (isExtendableTableConfig(tableConfig)) {
      for (const k in tableConfig.extendedFieldsToTableFieldsMap) {
         const conf = tableConfig.extendedFieldsToTableFieldsMap[k];
         if (isOtherTableMapping(conf)) {
            if (conf.cardinality.name !== 'oneToMany') {
               continue;
            }
            const extendedFieldsToSelect = req.getFields()[k as unknown as keyof Fields] as RequestableFields<any>; // TODO fix this cast
            if (extendedFieldsToSelect === undefined) {
               continue;
            }

            // loop on all fields of table
            const fieldsToSelect = createNewFieldsToSelect<any>();
            for (const subkey in conf.tableConfig.domainFieldsToTableFieldsMap) {
               const map = getDomainFieldsToTableFieldsMapping(conf.tableConfig, subkey);
               if (isSameTableMapping(map)) {
                  if (conf.tableConfig.isToSelect(extendedFieldsToSelect, subkey)) {
                     addFieldToSelect(fieldsToSelect, conf.tableConfig.tableName, map.name, subkey);
                  }
               }
            }

            if (fieldsToSelect.size === 0) {
               continue;
            }
            // process join
            const joins: Join = new Map();
            const exp = conf.tableConfig.getDomainExpandableFieldsToTableFieldsMap();
            const mod = exp[req.getName()];
            const joinTableName = conf.tableConfig.tableName;
            const map = joins.get(joinTableName);
            if (map === undefined) {
               if (mod.cardinality.name === 'oneToOne') {
                  joins.set(joinTableName, {
                     relationship: `${mod.tableConfig.tableName}.${mod.tableConfig.tablePrimaryKey}=${joinTableName}.${
                        mod.cardinality.foreignKey as string
                     }`,
                     filters: [],
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
            const id = createRequestFullFieldName(tableConfig.tableName, tableConfig.tablePrimaryKey);
            const pk = createSqlAlias(tableConfig.tableName, tableConfig.tablePrimaryKey);

            const select = `SELECT ${id}, ${fields}`;
            const from = `FROM ${tableConfig.tableName}`;
            // const filters: string[] = []; //processFilters(req, tableConfig.domainFieldsToTableFieldsMap);
            const where = `WHERE ${tableConfig.tableName}.${tableConfig.tablePrimaryKey} IN (${ids.join(', ')})`;

            const resultsSql = `${select}
${from}
${joinsStr.join('\n')}
${where}
LIMIT ${req.getOptions().pagination.offset},${req.getOptions().pagination.limit}`;

            const { res: dbRecords, report } = await executeRequest(tableConfig.select, resultsSql);
            resultsToReconcile.report.requests.push(report);

            for (const resourceId of ids) {
               const toPopulate = resultsToReconcile.results.find(
                  (d) => d[tableConfig.tablePrimaryKey].toString() === resourceId,
               );
               if (toPopulate === undefined) {
                  console.log(`big problem, cannot find resource ${tableConfig.tableName} of id [${resourceId}]`);
                  continue;
               }

               const domainPk = createSqlAlias(conf.tableConfig.tableName, conf.tableConfig.tablePrimaryKey);
               const records = dbRecords
                  .filter((r) => r[pk].toString() === resourceId)
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
                  conf.tableConfig.fromDbRecordsToDomains !== undefined
                     ? conf.tableConfig.fromDbRecordsToDomains(records)
                     : records;
            }
         }
      }
   }

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

      // add the field to select mapping the id
      let mainDomainMappingFoundInExpandable: undefined | DomainExpandableFieldsToTableFields<any>;
      for (const mappingKey in conf.tableConfig.getDomainExpandableFieldsToTableFieldsMap()) {
         const mapping = conf.tableConfig.getDomainExpandableFieldsToTableFieldsMap()[mappingKey];
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
      expandable.setFilter({ key: requestField, operator: 'includes', value: ids.join(',') as any });
      expandable.dontSelectCount();

      // const res = await fetch(conf.tableConfig, expandable, false);
      const res = await conf.dbt.fetch(expandable);

      for (const result of res.results) {
         // find the resource id
         const resourceId = result[requestField] as number;
         const toPopulate = resultsToReconcile.results.find((d) => d[tableConfig.tablePrimaryKey] === resourceId);
         if (toPopulate === undefined) {
            console.log(`big problem, cannot find resource ${tableConfig.tableName} of id [${resourceId}]`);
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

function getDomainFieldsToTableFieldsMapping<Fields, ExpandableFields, TableFields extends string, Extended>(
   tableConfig:
      | TableConfig<Fields, ExpandableFields, TableFields>
      | ExtendableTableConfig<Fields, TableFields, Extended>,
   key: keyof Fields,
): SameTableMapping<TableFields> | OtherTableMapping<TableFields> {
   let mapping: SameTableMapping<TableFields> | OtherTableMapping<TableFields> =
      tableConfig.domainFieldsToTableFieldsMap[key];
   if (mapping === undefined) {
      // it should be an extended field
      if (!isExtendableTableConfig(tableConfig)) {
         throw new Error(
            `configuration problem: no "domain to db field mapping" for extended field [${
               key as string
            }] in table config of [${tableConfig.tableName}]`,
         );
      }

      mapping = tableConfig.extendedFieldsToTableFieldsMap[key as unknown as keyof Extended]; // TODO fix this cast
      if (mapping === undefined) {
         throw new Error(`configuration problem: no field [${key as string}] in domain to db field mapping`);
      }
   }

   return mapping;
}

function addFieldToSelect<Fields>(
   m: FieldsToSelect<Fields>,
   tableName: string,
   fieldName: string,
   key: keyof Fields,
): void {
   m.set(createSqlAlias(tableName, fieldName), {
      fullFieldToSelect: createRequestFullFieldName(tableName, fieldName),
      domainFieldname: key,
   });
}

function createRequestFullFieldName(tableName: string, fieldName: string): string {
   return `${tableName}.${fieldName} AS ${createSqlAlias(tableName, fieldName)}`;
}

function createSqlAlias(tableName: string, fieldName: string): string {
   return `${tableName}$${fieldName}`;
}

function splitSqlAlias(alias: string): string[] {
   return alias.split('$');
}

function createNewFieldsToSelect<Fields>(): FieldsToSelect<Fields> {
   return new Map<
      string,
      {
         domainFieldname: keyof Fields;
         fullFieldToSelect: string;
      }
   >();
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
   includes: {
      format: (field: string, value: string | number | number[]): string =>
         commonFormat(
            field,
            'IN',
            ((value: string | number | number[]) => {
               if (Array.isArray(value)) {
                  return `(${value.join(', ')})`;
               }
               return value;
            })(value),
         ),
   },
};

type FieldsToSelect<Fields> = Map<
   string,
   {
      domainFieldname: keyof Fields;
      fullFieldToSelect: string;
   }
>;
type Join = Map<
   string, // table name
   {
      relationship: string;
      filters: string[];
   }
>;
type DatabaseOperator = '=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'IN';
type ComparisonOperatorMap = {
   [key in Operator]: {
      format: (field: string, value: number | string | number[]) => string;
   };
};

export abstract class SimpleDatabaseTable<DRN extends string, F, E, TF extends string> extends DatabaseTable<
   DRN,
   F,
   E,
   TF
> {
   protected buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DRN]: DatabaseTable<DRN, F, E, TF>;
   }): DomainExpandableFieldsToTableFieldsMap<E, TF> {
      return {} as any;
   }

   protected extendedTableConfigToInit(select: SelectMethod): void {}
}

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
      const domainExpandableFieldsToTable = this.tableConfig.getDomainExpandableFieldsToTableFieldsMap();
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
         const res = this.getFieldsToSelect(tableDetails.tableConfig, expandable);
         for (const [key, value] of res) {
            fieldsToSelect.set(key, value as any);
         }

         // process join
         const tableConfig = tableDetails.tableConfig;
         const map = joins.get(tableConfig.tableName);
         if (map === undefined) {
            joins.set(tableConfig.tableName, {
               relationship: `${tableConfig.tableName}.${tableConfig.tablePrimaryKey}=${this.tableConfig.tableName}.${tableDetails.cardinality.foreignKey}`,
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

   protected populateWithOneToOneExpandables(
      result: any,
      expandableFieldsToSelect: FieldsToSelect<E>,
      dbRecord: DbRecord,
   ): void {
      for (const key of expandableFieldsToSelect.keys()) {
         let expandableName = splitSqlAlias(key)[0];

         // block to manage when the expandable name is different from the Domain name
         for (const k in this.tableConfig.getDomainExpandableFieldsToTableFieldsMap()) {
            const exp = this.tableConfig.getDomainExpandableFieldsToTableFieldsMap()[k];
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
         result.expandables[expandableName][fieldName] = dbRecord[key];
      }
   }
}

export abstract class DatabaseTableWithExtended<DRN extends string, F, TF extends string> extends DatabaseTable<
   DRN,
   F,
   {},
   TF
> {
   protected buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DRN]: DatabaseTable<DRN, F, {}, TF>;
   }): DomainExpandableFieldsToTableFieldsMap<{}, TF> {
      return {} as any;
   }
}
