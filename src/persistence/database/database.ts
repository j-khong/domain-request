import { Report, DomainResult } from 'persistence';
import { DomainFields, DomainExpandables, DomainRequest, Operator, snakeToCamel } from '../../DomainRequest';
import {
   DomainExpandableFieldsToTableFieldsMap,
   DomainFieldsToTableFieldsMap,
   SelectMethodResult,
   TableConfig,
} from './types';

export async function fetch<Fields, ExpandableFields, TableFields extends string, Name extends string>(
   tableConfig: TableConfig<Fields, ExpandableFields, TableFields>,
   req: DomainRequest<Name, Fields, ExpandableFields>,
   selectCount = true,
): Promise<DomainResult> {
   const results: any[] = [];
   const report = new Report();
   const ret = {
      domainName: req.getName(),
      results,
      report,
      total: 0,
   };
   // fetch results with
   //  fields of the domain
   //  expanded fields of oneToOne Domains
   const res = fetchFieldsAndOneToOne(req, tableConfig);
   if (res === undefined) {
      return ret;
   }

   const executeRequest = async (sql: string): Promise<SelectMethodResult> => {
      const start = new Date();
      const res = await tableConfig.select(sql);
      const end = new Date();
      report.requests.push({
         sql: sql,
         timeInMs: end.getTime() - start.getTime(),
      });
      return res;
   };

   if (selectCount) {
      const resCount = await executeRequest(res.resultsCountSql);
      ret.total = Number.parseInt(resCount[0].total as any);
   }

   const dbResults = await executeRequest(res.resultsSql);
   for (const dbRecord of dbResults) {
      const result: any = {};
      for (const key of res.fieldsToSelect.keys()) {
         const fieldToSelect = res.fieldsToSelect.get(key);
         const fieldName = fieldToSelect !== undefined ? fieldToSelect.domainFieldname : '';
         result[fieldName] = dbRecord[key];
      }
      for (const key of res.expandableFieldsToSelect.keys()) {
         const expandableName = splitSqlAlias(key)[0];

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

   const resultsCountSql = `SELECT count(${tableConfig.tableName}.${tableConfig.tablePrimaryKey}) as total
${from}
${joins.join('\n')}
${where}`;

   const resultsSql = `${select}
${from}
${joins.join('\n')}
${where}
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

   const expandables = req.getExpandables();
   for (const expKey in expandables) {
      const conf = tableConfig.getDomainExpandableFieldsToTableFieldsMap()[expKey];
      if (conf.cardinality !== 'oneToMany') {
         continue;
      }
      const expandable = expandables[expKey];

      // add the field to select mapping the id
      const fieldToAdd = conf.tableConfig.getDomainExpandableFieldsToTableFieldsMap()[tableConfig.tableName].foreignKey;

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
         }

         // add the expandables
         /* eslint-disable @typescript-eslint/no-dynamic-delete */
         delete result[requestField];
         toPopulate.expandables[expandable.getName()] = result;
      }
      resultsToReconcile.report.requests.push(...res.report.requests);
   }
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
      const tableDetails = domainExpandableFieldsToTable[key];

      if (tableDetails.cardinality !== 'oneToOne') {
         continue;
      }
      if (tableDetails.foreignKey === undefined) {
         throw new Error('config problem foreignKey is not populated for oneToOne cardinality');
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
            relationship: `${module.tableName}.${module.tablePrimaryKey}=${table.tableName}.${tableDetails.foreignKey}`,
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
      addFieldToSelect(fieldsToSelect, tableName, mapping.name, v);
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
