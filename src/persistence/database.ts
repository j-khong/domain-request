import { Report, DomainResult } from 'persistence';
import { DomainFields, DomainExpandables, DomainRequest, Operator, snakeToCamel } from '../DomainRequest';

// can be an id (string | number) but also an ids list (1,45,3) to be used with IN ()
export const toTableId = (o: any): number[] => o.split(',').map((n: string) => toNumber(n));

export const toNumber = (o: any): number => {
   const r = Number.parseFloat(o);
   if (isNaN(r)) {
      return 0;
   }
   return r;
};
export const toBoolean = (o: boolean): string => `${Number(o)}`;
export const toString = (o: string): string => `'${o.toString()}'`;
export const toDate = (o: Date): string => `'${fromDateToMysqlDate(o)}'`;

export type DomainFieldsToTableFieldsMap<DomainFields, TableFields extends string> = {
   [Property in keyof DomainFields]: {
      name: TableFields;
      convert: (o: any) => number | string | number[];
      relationship?: {
         module: {
            domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<any, string>;
            tableName: string;
            tablePrimaryKey: string;
         };
      };
   };
};

export type Cardinality = 'oneToOne' | 'oneToMany';

export type DomainExpandableFieldsToTableFieldsMap<
   ExpandableFields extends DomainFields,
   TableFields extends string,
> = {
   [Property in keyof ExpandableFields]: {
      tableConfig: TableConfig<any, any, any>;
      currentTableField?: TableFields; // when cardinality = oneToMany
      cardinality: Cardinality;
      foreignKey?: TableFields; // when cardinality = oneToOne
   };
};

type SelectMethodResult = Array<{ [key: string]: string | number | Date | boolean }>;
export type SelectMethod = (query: string) => Promise<SelectMethodResult>;
export class TableConfig<Fields, ExpandableFields, TableFields extends string> {
   constructor(
      public readonly tableName: string,
      public readonly tablePrimaryKey: string,
      public readonly domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields>,
   ) {}

   public select: SelectMethod = async (sql: string) => {
      console.log(sql);
      return [];
   };

   private domainExpandableFieldsToTable:
      | DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields>
      | undefined;

   getDomainExpandableFieldsToTableFieldsMap(): DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields> {
      if (this.domainExpandableFieldsToTable === undefined) {
         throw new Error('domainExpandableFieldsToTable in undefined, call init');
      }
      return this.domainExpandableFieldsToTable;
   }

   init(
      domainExpandableFieldsToTable: DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields>,
      select?: SelectMethod,
   ): void {
      this.domainExpandableFieldsToTable = domainExpandableFieldsToTable;
      if (select !== undefined) {
         this.select = select;
      }
   }
}

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
   const res = generateSQLRequests(req, tableConfig);
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
         const fieldName = res.fieldsToSelect.get(key)?.domainFieldname || '';
         result[fieldName] = dbRecord[key];
      }
      for (const key of res.expandableFieldsToSelect.keys()) {
         const [expandableName, dbFieldName] = splitSqlAlias(key);

         if (result.expandables === undefined) {
            result.expandables = {};
         }
         if (result.expandables[expandableName] === undefined) {
            result.expandables[expandableName] = {};
         }
         const fieldName = res.expandableFieldsToSelect.get(key)?.domainFieldname || '';
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
      const requestField = snakeToCamel(fieldToAdd) as any;
      expandable.setField(requestField, true);
      expandable.setFilter({ key: requestField, operator: 'includes', value: ids.join(',') as any });

      const res = await fetch(conf.tableConfig, expandable, false);

      for (const result of res.results) {
         // find the resource id
         const resourceId = result[requestField];
         const toPopulate = resultsToReconcile.results.find((d) => d[tableConfig.tablePrimaryKey] === resourceId);
         if (toPopulate === undefined) {
            console.log(`big problem, cannot find resource ${tableConfig.tableName} of id [${resourceId}]`);
            continue;
         }
         if (toPopulate.expandables === undefined) {
            toPopulate.expandables = {};
         }

         // add the expandables
         delete result[requestField];
         toPopulate.expandables[expandable.getName()] = result;
      }
      resultsToReconcile.report.requests.push(...res.report.requests);
   }
}

export function generateSQLRequests<
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

type Join = Map<
   string, // table name
   {
      relationship: string;
      filters: string[];
   }
>;

// function processFieldsToSelect<Fields, ExpandableFields, TableFields extends string>(
//    tableName: string,
//    req: DomainRequest<Fields, ExpandableFields>,
//    domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields>,
// ): {
//    fieldsToSelect: FieldsToSelect<Fields>;
//    joins: Join;
// } {
//    const fieldsToSelect = createNewFieldsToSelect<Fields>();
//    const joins: Join = new Map();
//    for (const v of req.getFieldsNames()) {
//       const mapping = domainFieldsToTableFieldsMap[v];
//       if (mapping.relationship === undefined) {
//          // regular field
//          addFieldToSelect(fieldsToSelect, tableName, mapping.name, v);
//       } else {
//          // field found in the join table
//          const module = mapping.relationship.module;
//          console.log('field is ', v);
//          console.log('field found in the join table:', mapping.name);
//          console.log('module', module);

//          if (module.domainFieldsToTableFieldsMap[v] === undefined) {
//             console.error(`cannot find mapping of domain field ${v as string} with the join table ${module.tableName}`);
//             continue;
//          }
//          addFieldToSelect(fieldsToSelect, module.tableName, module.domainFieldsToTableFieldsMap[v].name, v);

//          const map = joins.get(module.tableName);
//          if (map === undefined) {
//             joins.set(module.tableName, {
//                relationship: `${module.tableName}.${module.tablePrimaryKey}=${tableName}.${mapping.name}`,
//                filters: [],
//             });
//          }
//          // else {
//          //    map.filters.push()
//          // }
//       }
//    }
//    return { fieldsToSelect, joins };
// }

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

type FieldsToSelect<Fields> = Map<
   string,
   {
      domainFieldname: keyof Fields;
      fullFieldToSelect: string;
   }
>;

function createNewFieldsToSelect<Fields>() {
   return new Map<
      string,
      {
         domainFieldname: keyof Fields;
         fullFieldToSelect: string;
      }
   >();
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

      // for (const [key, value] of res.joins) {
      //    const record = joins.get(key);
      //    if (record === undefined) {
      //       joins.set(key, value);
      //    } else {
      //       if (record.relationship === value.relationship) {
      //          for (const filter of value.filters) {
      //             if (!record.filters.includes(filter)) {
      //                record.filters.push(filter);
      //             }
      //          }
      //       } else {
      //          record.filters = value.filters;
      //       }
      //    }
      // }
   }

   return { fieldsToSelect, joins };
}

type DatabaseOperator = '=' | '>' | '>=' | '<' | '<=' | 'LIKE';
type ComparisonOperatorMap = {
   [key in Operator]: {
      format: (field: string, value: number | string | number[]) => string;
   };
};

function commonFormat(field: string, operator: DatabaseOperator, value: number | string | number[]): string {
   return `${field}${operator}${value}`;
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
      format: (field: string, value: string | number | number[]): string => {
         if (typeof value === 'string' && value.length > 2) {
            if (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
               const rawData = value.slice(1, value.length - 1);
               value = `'%${rawData}%'`;
            }
         }

         return `${field} LIKE ${value}`;
      },
   },
   includes: {
      format: (field: string, value: string | number | number[]): string => {
         if (Array.isArray(value)) {
            return `${field} IN (${value.join(', ')})`;
         }

         return `${field} IN (${value})`;
      },
   },
};

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

function fromDateToMysqlDate(d: Date): string {
   const date = [d.getFullYear(), format2digits(d.getMonth() + 1), format2digits(d.getDate())];
   const time = [d.getHours(), d.getMinutes(), d.getSeconds()];
   return `${date.join('-')} ${time.map((v) => format2digits(v)).join(':')}`;
}

function format2digits(val: number): string {
   return String(val).padStart(2, '0');
}
