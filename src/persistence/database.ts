import { DomainFields, DomainExpandables, DomainRequest, Operator } from '../DomainRequest';

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
      convert: (o: any) => number | string;
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
      module: {
         domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<any, string>;
         tableName: string;
         tablePrimaryKey: string;
         foreignKeys?: Map<string, string>;
      };
      currentTableField: TableFields;
      cardinality: Cardinality;
   };
};

export async function fetch<Fields, ExpandableFields, TableFields extends string>(
   tableConfig: {
      tableName: string;
      tablePrimaryKey: string;
      domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields>;
      domainExpandableFieldsToTable: DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields>;
   },
   select: (sql: string) => Promise<any>,
   req: DomainRequest<Fields, ExpandableFields>,
): Promise<void> {
   // fetch results with
   //  fields of the domain
   //  expanded fields of oneToOne Domains
   const res = generateSQLRequests(
      tableConfig.tableName,
      tableConfig.tablePrimaryKey,
      req,
      tableConfig.domainFieldsToTableFieldsMap,
      tableConfig.domainExpandableFieldsToTable,
   );
   if (res === undefined) {
      return;
   }
   const count = await select(res.resultsCountSql);
   console.log('count:', count, res.resultsCountSql);
   const results = await select(res.resultsSql);
   // console.log('results:', results, res.resultsSql, res.fieldsToSelect);
   console.log('results:', res.resultsSql, res.fieldsToSelect, res.expandableFieldsToSelect);

   // TODO reconcile db results in domain
   // for (const dbRecord of results) {
   //    for (const key of res.fieldsToSelect.keys()) {
   //       console.log(key, dbRecord[key]);
   //    }
   // }

   // fetch results with oneToMany
   // const sqls = generateSQLRequestsOneToMany(
   //    results.map((r: any) => r.id.toString()),
   //    tableName,
   //    tablePrimaryKey,
   //    req,
   //    domainFieldsToTableFieldsMap,
   //    domainExpandableFieldsToTable,
   // );
   // console.log('sql:', sqls);
   // for (const sql of sqls) {
   //    const results = await select(sql);
   //    console.log('results:', results);
   // }
}

function generateSQLRequestsOneToMany<Fields, ExpandableFields, TableFields extends string>(
   ids: string[],
   tableName: string,
   tablePrimaryKey: string,
   req: DomainRequest<Fields, ExpandableFields>,
   domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields>,
   domainExpandableFieldsToTable: DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields>,
): {
   resultsSql: string;
   fieldsToSelect: Map<
      string,
      {
         domainFieldname: keyof ExpandableFields;
         fullFieldToSelect: string;
      }
   >;
} {
   const ret = {
      resultsSql: '',
      fieldsToSelect: new Map<
         string,
         {
            domainFieldname: keyof ExpandableFields;
            fullFieldToSelect: string;
         }
      >(),
   };

   if (ids.length === 0) {
      return ret;
   }
   const expandables = req.getExpandables();
   for (const expKey in expandables) {
      const expandable = expandables[expKey];
      //  TODO fix
      // const data = processOneToManyExpandables(expandable, tableName, domainExpandableFieldsToTable[expKey]);
      // if (data.fieldsToSelect.size === 0) {
      //    return ret;
      // }

      // ret.fieldsToSelect = data.fieldsToSelect;
      // const joins: string[] = [];
      // for (const [key, value] of data.joins) {
      //    joins.push(
      //       `LEFT JOIN ${key} ON ${value.relationship} ${
      //          value.filters.length > 0 ? ` AND ${value.filters.join(' AND ')}` : ''
      //       }`,
      //    );
      // }

      // const pk = `${tableName}.${tablePrimaryKey}`;

      // const select = `SELECT ${pk}, ${Array.from(ret.fieldsToSelect.values())
      //    .map((v) => v.fullFieldToSelect)
      //    .join(', ')}`;
      // const from = `FROM ${tableName}`;
      // const filters: string[] = []; //processFilters(expandable, domainFieldsToTableFieldsMap);
      // let where = `WHERE ${pk} IN (${ids.join(', ')})`;
      // where += filters.length === 0 ? '' : `AND ${filters.map((v) => `${tableName}.${v}`).join(' AND ')}`;

      // const sql = `${select}
      // ${from}
      // ${joins.join('\n')}
      // ${where}
      // LIMIT ${expandable.getOptions().limit}`;
      // ret.resultsSql = sql;
   }
   return ret;
}

function processOneToManyExpandables<
   Fields extends DomainFields,
   ExpandableFields extends DomainExpandables,
   TableFields extends string,
>(
   expandable: DomainRequest<DomainFields, DomainExpandables>,
   tableName: string,
   tableDetails: DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields>[keyof ExpandableFields],
): {
   fieldsToSelect: Map<
      string,
      {
         domainFieldname: keyof ExpandableFields;
         fullFieldToSelect: string;
      }
   >;
   joins: Join;
} {
   const ret = {
      fieldsToSelect: new Map<
         string,
         {
            domainFieldname: keyof ExpandableFields;
            fullFieldToSelect: string;
         }
      >(),
      joins: new Map(),
   };

   //   get from map the table data needed
   if (tableDetails.cardinality !== 'oneToMany' || expandable.getFieldsNames().length === 0) {
      return ret;
   }

   //   add this join first
   let joinDetails = ret.joins.get(tableDetails.module.tableName);
   if (joinDetails === undefined) {
      let fk = tableDetails.module.tablePrimaryKey;
      if (tableDetails.module.foreignKeys !== undefined) {
         const fkVal = tableDetails.module.foreignKeys.get(tableName);
         if (undefined === fkVal) {
            console.error(
               `cannot find the foreign key of ${tableName}.${tableDetails.currentTableField} in table ${tableDetails.module.tableName}`,
            );
            return ret;
         }
         fk = fkVal;
      }
      const relationship = `${tableDetails.module.tableName}.${fk} = ${tableName}.${tableDetails.currentTableField}`;
      joinDetails = {
         relationship,
         filters: [],
      };
      ret.joins.set(tableDetails.module.tableName, joinDetails);
   }

   //   add the fields to the select list
   const res = processFieldsToSelect(
      tableDetails.module.tableName,
      expandable,
      tableDetails.module.domainFieldsToTableFieldsMap,
   );
   ret.fieldsToSelect = res.fieldsToSelect as any;

   const filters = processFilters(expandable, tableDetails.module.domainFieldsToTableFieldsMap);
   if (filters.length > 0) {
      console.log('filters:', filters);
      joinDetails.filters.push(...filters.map((v) => `${tableDetails.module.tableName}.${v}`));
   }

   for (const [key, value] of res.joins) {
      const record = ret.joins.get(key);
      if (record === undefined) {
         ret.joins.set(key, value);
      } else {
         if (record.relationship === value.relationship) {
            for (const filter of value.filters) {
               if (!record.filters.includes(filter)) {
                  record.filters.push(filter);
               }
            }
         } else {
            record.filters = value.filters;
         }
      }
   }

   return ret;
}

export function generateSQLRequests<
   Fields extends DomainFields,
   ExpandableFields extends DomainExpandables,
   TableFields extends string,
>(
   tableName: string,
   tablePrimaryKey: string,
   req: DomainRequest<Fields, ExpandableFields>,
   domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields>,
   domainExpandableFieldsToTable: DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields>,
):
   | {
        resultsCountSql: string;
        resultsSql: string;
        fieldsToSelect: Map<
           string,
           {
              domainFieldname: keyof Fields;
              fullFieldToSelect: string;
           }
        >;
        expandableFieldsToSelect: Map<
           string,
           {
              domainFieldname: keyof ExpandableFields;
              fullFieldToSelect: string;
           }
        >;
     }
   | undefined {
   const fieldsToSelect = processFieldsToSelect(tableName, req, domainFieldsToTableFieldsMap).fieldsToSelect;

   const data = processOneToOneExpandables(tableName, req, domainExpandableFieldsToTable);
   const expandableFieldsToSelect = data.fieldsToSelect;
   const joins: string[] = [];
   for (const [key, value] of data.joins) {
      joins.push(
         `LEFT JOIN ${key} ON ${value.relationship} ${
            value.filters.length > 0 ? ` AND ${value.filters.join(' AND ')}` : ''
         }`,
      );
   }

   if (fieldsToSelect.size === 0) {
      return undefined;
   }

   const pk = `${tableName}.${tablePrimaryKey}`;
   // if (!fieldsToSelect.includes(pk)) {
   //    fieldsToSelect.push(pk);
   // }

   const fields = Array.from(fieldsToSelect.values())
      .map((v) => v.fullFieldToSelect)
      .join(', ');
   const expandableFields =
      expandableFieldsToSelect.size === 0
         ? ''
         : `, ${Array.from(data.fieldsToSelect.values())
              .map((v) => v.fullFieldToSelect)
              .join(', ')}`;
   const select = `SELECT ${pk}, ${fields} ${expandableFields}`;
   const from = `FROM ${tableName}`;
   const filters = processFilters(req, domainFieldsToTableFieldsMap);
   const where = filters.length === 0 ? '' : `WHERE ${filters.map((v) => `${tableName}.${v}`).join(' AND ')}`;

   const resultsCountSql = `SELECT count(${tableName}.${tablePrimaryKey})
${from}
${joins.join('\n')}
${where}`;

   const resultsSql = `${select}
${from}
${joins.join('\n')}
${where}
LIMIT ${req.getOptions().limit}`;

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

function processFieldsToSelect<Fields, ExpandableFields, TableFields extends string>(
   tableName: string,
   req: DomainRequest<Fields, ExpandableFields>,
   domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields>,
): {
   fieldsToSelect: Map<
      string,
      {
         domainFieldname: keyof Fields;
         fullFieldToSelect: string;
      }
   >;
   joins: Join;
} {
   const fieldsToSelect = new Map<
      string,
      {
         domainFieldname: keyof Fields;
         fullFieldToSelect: string;
      }
   >();
   const joins: Join = new Map();
   for (const v of req.getFieldsNames()) {
      const mapping = domainFieldsToTableFieldsMap[v];
      if (mapping.relationship === undefined) {
         // regular field
         addFieldToSelect(fieldsToSelect, tableName, mapping.name, v);
      } else {
         // field found in the join table
         const module = mapping.relationship.module;
         console.log('field is ', v);
         console.log('field found in the join table:', mapping.name);
         console.log('module', module);

         if (module.domainFieldsToTableFieldsMap[v] === undefined) {
            console.error(`cannot find mapping of domain field ${v as string} with the join table ${module.tableName}`);
            continue;
         }
         addFieldToSelect(fieldsToSelect, module.tableName, module.domainFieldsToTableFieldsMap[v].name, v);

         const map = joins.get(module.tableName);
         if (map === undefined) {
            joins.set(module.tableName, {
               relationship: `${module.tableName}.${module.tablePrimaryKey}=${tableName}.${mapping.name}`,
               filters: [],
            });
         }
         // else {
         //    map.filters.push()
         // }
      }
   }
   return { fieldsToSelect, joins };
}

function addFieldToSelect<Fields>(
   m: Map<
      string,
      {
         domainFieldname: keyof Fields;
         fullFieldToSelect: string;
      }
   >,
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

function processOneToOneExpandables<Fields, ExpandableFields extends DomainExpandables, TableFields extends string>(
   tableName: string,
   req: DomainRequest<Fields, ExpandableFields>,
   domainExpandableFieldsToTable: DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields>,
): {
   fieldsToSelect: Map<
      string,
      {
         domainFieldname: keyof ExpandableFields;
         fullFieldToSelect: string;
      }
   >;
   joins: Join;
} {
   const fieldsToSelect = new Map<
      string,
      {
         domainFieldname: keyof ExpandableFields;
         fullFieldToSelect: string;
      }
   >();
   const joins: Join = new Map();
   const expandables = req.getExpandables();
   for (const expKey in expandables) {
      const key = expKey as keyof ExpandableFields;

      //   get from map the table data needed
      const tableDetails = domainExpandableFieldsToTable[key];

      if (tableDetails.cardinality !== 'oneToOne') {
         continue;
      }

      const expandable = expandables[key];
      if (expandable.getFieldsNames().length === 0) {
         continue;
      }
      //   add the fields to the select list
      const res = processFieldsToSelect(
         tableDetails.module.tableName,
         expandable,
         tableDetails.module.domainFieldsToTableFieldsMap,
      );

      for (const [key, value] of res.fieldsToSelect) {
         fieldsToSelect.set(key, value as any);
      }

      const filters = processFilters(expandable as any, tableDetails.module.domainFieldsToTableFieldsMap);
      if (filters.length > 0) {
         const joinDetails = joins.get(tableDetails.module.tableName);
         if (undefined !== joinDetails) {
            joinDetails.filters.push(...filters.map((v) => `${tableDetails.module.tableName}.${v}`));
         }
      }

      for (const [key, value] of res.joins) {
         const record = joins.get(key);
         if (record === undefined) {
            joins.set(key, value);
         } else {
            if (record.relationship === value.relationship) {
               for (const filter of value.filters) {
                  if (!record.filters.includes(filter)) {
                     record.filters.push(filter);
                  }
               }
            } else {
               record.filters = value.filters;
            }
         }
      }
   }

   return { fieldsToSelect, joins };
}

type DatabaseOperator = '=' | '>' | '>=' | '<' | '<=' | 'LIKE';
type ComparisonOperatorMap = {
   [key in Operator]: {
      format: (field: string, value: number | string) => string;
   };
};

function commonFormat(field: string, operator: DatabaseOperator, value: number | string): string {
   return `${field}${operator}${value}`;
}
const comparisonOperatorMap: ComparisonOperatorMap = {
   equals: {
      format: (field: string, value: number | string): string => commonFormat(field, '=', value),
   },
   greaterThan: {
      format: (field: string, value: number | string): string => commonFormat(field, '>', value),
   },
   greaterThanOrEquals: {
      format: (field: string, value: number | string): string => commonFormat(field, '>=', value),
   },
   lesserThan: {
      format: (field: string, value: number | string): string => commonFormat(field, '<', value),
   },
   lesserThanOrEquals: {
      format: (field: string, value: number | string): string => commonFormat(field, '<=', value),
   },
   contains: {
      format: (field: string, value: string | number): string => {
         if (typeof value === 'string' && value.length > 2) {
            if (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'") {
               const rawData = value.slice(1, value.length - 1);
               value = `'%${rawData}%'`;
            }
         }

         return `${field} LIKE ${value}`;
      },
   },
};

function processFilters<Fields, ExpandableFields, TableFields extends string>(
   req: DomainRequest<Fields, ExpandableFields>,
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
