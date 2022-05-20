import { Report, DomainResult } from '../index';
import { DomainFields, DomainExpandables, DomainRequest, Operator, snakeToCamel } from '../../DomainRequest';
import {
   DomainExpandableFieldsToTableFields,
   DomainExpandableFieldsToTableFieldsMap,
   DomainFieldsToTableFieldsMap,
   isOtherTableMapping,
   isSameTableMapping,
   SelectMethod,
   SelectMethodResult,
   TableConfig,
} from './types';

export abstract class DatabaseTable<DRN extends string, F, E, TF extends string> {
   constructor(private readonly tableConfig: TableConfig<F, E, TF>) {}

   abstract buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DRN]: DatabaseTable<DRN, F, E, TF>;
   }): DomainExpandableFieldsToTableFieldsMap<E, TF>;

   init(
      select: SelectMethod,
      allDbTables: {
         [Property in DRN]: DatabaseTable<DRN, F, E, TF>;
      },
   ): void {
      this.tableConfig.init(this.buildDomainExpandableFieldsToTableFieldsMap(allDbTables), select);
      this.otherTableConfigToInit(select);
   }

   protected otherTableConfigToInit(select: SelectMethod): void {}

   async fetch(req: DomainRequest<DRN, F, E>): Promise<DomainResult> {
      return fetch(this.tableConfig, req);
   }

   getTableConfig(): TableConfig<F, E, TF> {
      return this.tableConfig;
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

async function fetch<Fields, ExpandableFields, TableFields extends string, Name extends string>(
   tableConfig: TableConfig<Fields, ExpandableFields, TableFields>,
   req: DomainRequest<Name, Fields, ExpandableFields>,
   selectCount = true,
): Promise<DomainResult> {
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
   const res = fetchFieldsAndOneToOne(req, tableConfig);
   if (res === undefined) {
      return ret;
   }

   if (selectCount) {
      const { res: resCount, report } = await executeRequest(tableConfig.select, res.resultsCountSql);
      ret.total = Number.parseInt(resCount[0].total as any);
      ret.report.requests.push(report);
   }

   const { res: dbResults, report } = await executeRequest(tableConfig.select, res.resultsSql);
   ret.report.requests.push(report);
   for (const dbRecord of dbResults) {
      const result: any = {};
      for (const key of res.fieldsToSelect.keys()) {
         const fieldToSelect = res.fieldsToSelect.get(key);
         const fieldName = fieldToSelect !== undefined ? fieldToSelect.domainFieldname : '';
         result[fieldName] = dbRecord[key];
      }
      for (const key of res.expandableFieldsToSelect.keys()) {
         let expandableName = splitSqlAlias(key)[0];

         // manage when the expandable name is different from the Domain name
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
         const fieldToSelect = res.expandableFieldsToSelect.get(key);
         const fieldName = fieldToSelect !== undefined ? fieldToSelect.domainFieldname : '';
         result.expandables[expandableName][fieldName] = dbRecord[key];
      }
      ret.results.push(result);
   }

   // fetch results with oneToMany
   const pk = createSqlAlias(tableConfig.tableName, tableConfig.tablePrimaryKey);
   await fetchOneToMany(
      dbResults.map((r: any) => r[pk].toString()),
      ret,
      tableConfig,
      req,
   );

   return ret;
}

function fetchFieldsAndOneToOne<
   Fields extends DomainFields,
   ExpandableFields extends DomainExpandables,
   TableFields extends string,
   Name extends string,
>(
   req: DomainRequest<Name, Fields, ExpandableFields>,
   tableConfig: TableConfig<Fields, ExpandableFields, TableFields>,
):
   | {
        resultsCountSql: string;
        resultsSql: string;
        fieldsToSelect: FieldsToSelect<Fields>;
        expandableFieldsToSelect: FieldsToSelect<ExpandableFields>;
     }
   | undefined {
   const fieldsToSelect = getFieldsToSelect(tableConfig.tableName, req, tableConfig.domainFieldsToTableFieldsMap);

   const data = processOneToOneExpandables(
      { tableName: tableConfig.tableName, tablePrimaryKey: tableConfig.tablePrimaryKey },
      req,
      tableConfig.getDomainExpandableFieldsToTableFieldsMap(),
   );
   const expandableFieldsToSelect = data.fieldsToSelect;
   const joins: string[] = [];
   for (const [key, value] of data.joins) {
      joins.push(
         `LEFT JOIN ${key} ON ${value.relationship} ${
            value.filters.length > 0 ? ` AND ${value.filters.join(' AND ')}` : ''
         }`,
      );
   }

   if (fieldsToSelect.size === 0 && expandableFieldsToSelect.size === 0) {
      return undefined;
   }
   // add natural key, if not there (currently works with 1 field, TODO manage composition)
   addFieldToSelect(
      fieldsToSelect,
      tableConfig.tableName,
      tableConfig.tablePrimaryKey,
      req.getNaturalKey() as keyof Fields,
   );
   const fields = [
      ...Array.from(fieldsToSelect.values()).map((v) => v.fullFieldToSelect),
      ...Array.from(data.fieldsToSelect.values()).map((v) => v.fullFieldToSelect),
   ].join(', ');

   const select = `SELECT ${fields}`;
   const from = `FROM ${tableConfig.tableName}`;
   const filters = processFilters(req, tableConfig.domainFieldsToTableFieldsMap);
   const where =
      filters.length === 0 ? '' : `WHERE ${filters.map((v) => `${tableConfig.tableName}.${v}`).join(' AND ')}`;
   const orderby = req.getOptions().orderby
      ? `ORDER BY ${req.getOptions().orderby?.fieldname} ${req.getOptions().orderby?.sort}`
      : '';

   const resultsCountSql = `SELECT count(${tableConfig.tableName}.${tableConfig.tablePrimaryKey}) as total
${from}
${joins.join('\n')}
${where}`;

   const resultsSql = `${select}
${from}
${joins.join('\n')}
${where}
${orderby}
LIMIT ${req.getOptions().pagination.offset},${req.getOptions().pagination.limit}`;

   return {
      resultsCountSql,
      resultsSql,
      fieldsToSelect,
      expandableFieldsToSelect,
   };
}

async function fetchOneToMany<Fields, ExpandableFields, TableFields extends string, Name extends string>(
   ids: string[],
   resultsToReconcile: {
      results: any[];
      report: Report;
   },
   tableConfig: TableConfig<Fields, ExpandableFields, TableFields>,
   req: DomainRequest<Name, Fields, ExpandableFields>,
): Promise<void> {
   if (ids.length === 0) {
      return;
   }

   // searching oneToMany fields which are not expandables
   for (const k in tableConfig.domainFieldsToTableFieldsMap) {
      const conf = tableConfig.domainFieldsToTableFieldsMap[k];
      if (isOtherTableMapping(conf)) {
         if (conf.cardinality.name !== 'oneToMany') {
            continue;
         }
         if (req.getFields()[k] === false) {
            continue;
         }

         // loop on all fields of table
         const fieldsToSelect = createNewFieldsToSelect<any>();
         for (const k in conf.tableConfig.domainFieldsToTableFieldsMap) {
            const map = conf.tableConfig.domainFieldsToTableFieldsMap[k];
            if (isSameTableMapping(map)) {
               addFieldToSelect(fieldsToSelect, conf.tableConfig.tableName, map.name, k);
            }
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
                  value.filters.length > 0 ? ` AND ${value.filters.join(' AND ')}` : ''
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

         for (const result of dbRecords) {
            // find the resource id
            const resourceId = result[pk] as number;
            const toPopulate = resultsToReconcile.results.find((d) => d[tableConfig.tablePrimaryKey] === resourceId);
            if (toPopulate === undefined) {
               console.log(`big problem, cannot find resource ${tableConfig.tableName} of id [${resourceId}]`);
               continue;
            }
            if (toPopulate[k] === undefined) {
               toPopulate[k] = [];
            }

            const domain: any = {};
            const domainPk = createSqlAlias(conf.tableConfig.tableName, conf.tableConfig.tablePrimaryKey);
            for (const [key, value] of fieldsToSelect) {
               if (domainPk === key) {
                  continue;
               }
               domain[value.domainFieldname] = result[key];
            }
            toPopulate[k].push(domain);
         }
      }
   }

   const expandables = req.getExpandables();
   for (const expKey in expandables) {
      const conf = getTableDetails(tableConfig.getDomainExpandableFieldsToTableFieldsMap(), expKey);
      if (conf.cardinality.name !== 'oneToMany') {
         continue;
      }
      const expandable = expandables[expKey];

      // add the field to select mapping the id
      const cardinality =
         conf.tableConfig.getDomainExpandableFieldsToTableFieldsMap()[tableConfig.tableName].cardinality;
      if (cardinality.name !== 'oneToOne') {
         throw new Error(
            `configuration error : cardinality of ${tableConfig.tableName} -> ${tableConfig.tableName} should be oneToOne`,
         );
      }
      const fieldToAdd = cardinality.foreignKey;

      // add the filter
      const requestField = snakeToCamel<any, any>(fieldToAdd);
      expandable.setField(requestField, true);
      expandable.setFilter({ key: requestField, operator: 'includes', value: ids.join(',') as any });

      const res = await fetch(conf.tableConfig, expandable, false);

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

function getTableDetails<ExpandableFields extends DomainExpandables, TableFields extends string>(
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
         }
      }
   }
   return tableDetails;
}

function processOneToOneExpandables<
   Fields,
   ExpandableFields extends DomainExpandables,
   TableFields extends string,
   Name extends string,
>(
   table: { tableName: string; tablePrimaryKey: string },
   req: DomainRequest<Name, Fields, ExpandableFields>,
   domainExpandableFieldsToTable: DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields>,
): {
   fieldsToSelect: FieldsToSelect<ExpandableFields>;
   joins: Join;
} {
   const fieldsToSelect = createNewFieldsToSelect();
   const joins: Join = new Map();
   const expandables = req.getExpandables();
   for (const expKey in expandables) {
      const key = expKey as keyof ExpandableFields;

      //   get from map the table data needed
      const tableDetails = getTableDetails(domainExpandableFieldsToTable, key);
      if (tableDetails.cardinality.name !== 'oneToOne') {
         continue;
      }

      const expandable = expandables[key];
      if (expandable.getFieldsNames().length === 0) {
         continue;
      }
      //   add the fields to the select list
      const res = getFieldsToSelect(
         tableDetails.tableConfig.tableName,
         expandable,
         tableDetails.tableConfig.domainFieldsToTableFieldsMap,
      );
      for (const [key, value] of res) {
         fieldsToSelect.set(key, value as any);
      }

      // process join
      const module = tableDetails.tableConfig;
      const map = joins.get(module.tableName);
      if (map === undefined) {
         joins.set(module.tableName, {
            relationship: `${module.tableName}.${module.tablePrimaryKey}=${table.tableName}.${tableDetails.cardinality.foreignKey}`,
            filters: [],
         });
      }

      const filters = processFilters(expandable as any, module.domainFieldsToTableFieldsMap);
      if (filters.length > 0) {
         const joinDetails = joins.get(module.tableName);
         if (undefined !== joinDetails) {
            joinDetails.filters.push(...filters.map((v) => `${module.tableName}.${v}`));
         }
      }
   }

   return { fieldsToSelect, joins };
}

function processFilters<Fields, ExpandableFields, TableFields extends string, Name extends string>(
   req: DomainRequest<Name, Fields, ExpandableFields>,
   domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields>,
): string[] {
   const filters = req.getFilters();
   const result: string[] = [];

   for (const key in filters) {
      const fieldMapper = domainFieldsToTableFieldsMap[key];
      if (!isSameTableMapping(fieldMapper)) {
         // don't manage filtering yet
         continue;
      }
      const comparison = filters[key];
      if (comparison === undefined) {
         continue;
      }
      const comparisonMapper = comparisonOperatorMap[comparison.operator];
      result.push(comparisonMapper.format(fieldMapper.name, fieldMapper.convert(comparison.value)));
   }

   return result;
}

function getFieldsToSelect<Fields, ExpandableFields, TableFields extends string, Name extends string>(
   tableName: string,
   req: DomainRequest<Name, Fields, ExpandableFields>,
   domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields>,
): FieldsToSelect<Fields> {
   const fieldsToSelect = createNewFieldsToSelect<Fields>();
   for (const v of req.getFieldsNames()) {
      const mapping = domainFieldsToTableFieldsMap[v];
      if (isSameTableMapping(mapping)) {
         addFieldToSelect(fieldsToSelect, tableName, mapping.name, v);
      }
   }
   return fieldsToSelect;
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
