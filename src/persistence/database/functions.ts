import { DomainResult } from '../index';
import {
   AndArrayComparison,
   OrArrayComparison,
   Comparison,
   isAndArrayComparison,
   isOrArrayComparison,
   DomainRequest,
   DomainExpandables,
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
} from './TableConfig';
import { ComparisonOperatorMap, DatabaseOperator, FieldsToSelect, Join } from './types';

export function processOneToOneExpandables<DRN extends string, F, E, TF extends string>(
   req: DomainRequest<DRN, F, E>,
   firstTableConfig: TableConfig<F, E, TF>,
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
      const res = getFieldsToSelect(tableDetails.tableConfig, expandable);
      for (const [key, value] of res) {
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

      const filters = processFilters(tableConfig, expandable as any);

      if (filters.length > 0) {
         const joinDetails = joins.get(tableConfig.tableName);
         if (undefined !== joinDetails) {
            joinDetails.filters.push(...filters);
         }
      }
   }

   return { fieldsToSelect, joins };
}

export function populateWithOneToOneExpandables<F, E, TF extends string>(
   tableConfig: TableConfig<F, E, TF>,
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

export function processFilters<Fields, ExpandableFields, TableFields extends string, Name extends string>(
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
            comparisonMapper.format(`${tableConfig.tableName}.${fieldMapper.name}`, fieldMapper.convertToDb(c.value)),
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

export function getFieldsToSelect<Fields, ExpandableFields, TableFields extends string, Name extends string>(
   tableConfig: TableConfig<Fields, ExpandableFields, TableFields>,
   req: DomainRequest<Name, Fields, ExpandableFields>,
): FieldsToSelect<Fields> {
   const fieldsToSelect = createNewFieldsToSelect<Fields>();
   for (const v of req.getFieldsNames()) {
      const mapping = getDomainFieldsToTableFieldsMapping(tableConfig, v);
      if (isSameTableMapping(mapping)) {
         addFieldToSelect(fieldsToSelect, tableConfig.tableName, mapping.name, v, mapping.convertToDomain);
      }
   }
   return fieldsToSelect;
}

export async function fetchExpandablesOneToMany<
   Fields,
   ExpandableFields,
   TableFields extends string,
   Name extends string,
   Extended,
>(
   resultsToReconcile: DomainResult,
   req: DomainRequest<Name, Fields, ExpandableFields>,
   tableConfig:
      | TableConfig<Fields, ExpandableFields, TableFields>
      | ExtendableTableConfig<Fields, Extended, TableFields>,
   ids: string[],
): Promise<void> {
   const expandables = req.getExpandables();
   for (const expKey in expandables) {
      const conf = getExpandableTableDetails(
         (
            tableConfig as TableConfig<Fields, ExpandableFields, TableFields>
         ).getDomainExpandableFieldsToTableFieldsMap(),
         expKey,
      );
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

export function getExpandableTableDetails<ExpandableFields extends DomainExpandables, TableFields extends string>(
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

export function getDomainFieldsToTableFieldsMapping<Fields, ExpandableFields, TableFields extends string, Extended>(
   tableConfig:
      | TableConfig<Fields, ExpandableFields, TableFields>
      | ExtendableTableConfig<Fields, Extended, TableFields>,
   key: keyof Fields,
): SameTableMapping<TableFields> | OtherTableMapping<TableFields> {
   let mapping: SameTableMapping<TableFields> | OtherTableMapping<TableFields> =
      tableConfig.domainFieldsToTableFieldsMap[key];
   if (mapping === undefined) {
      // it should be an extended field
      if (!isExtendableTableConfig(tableConfig as any)) {
         throw new Error(
            `configuration problem: no "domain to db field mapping" for extended field [${
               key as string
            }] in table config of [${tableConfig.tableName}]`,
         );
      }

      mapping = (tableConfig as unknown as ExtendableTableConfig<Fields, Extended, TableFields>)
         .extendedFieldsToTableFieldsMap[key as unknown as keyof Extended]; // TODO fix this cast
      if (mapping === undefined) {
         throw new Error(`configuration problem: no field [${key as string}] in domain to db field mapping`);
      }
   }

   return mapping;
}

export function addFieldToSelect<Fields>(
   m: FieldsToSelect<Fields>,
   tableName: string,
   fieldName: string,
   key: keyof Fields,
   convertToDomain: (o: any) => any,
): void {
   m.set(createSqlAlias(tableName, fieldName), {
      fullFieldToSelect: createRequestFullFieldName(tableName, fieldName),
      domainFieldname: key,
      convertToDomain,
   });
}

export function createRequestFullFieldName(tableName: string, fieldName: string): string {
   return `${tableName}.${fieldName} AS ${createSqlAlias(tableName, fieldName)}`;
}

export function createSqlAlias(tableName: string, fieldName: string): string {
   return `${tableName}$${fieldName}`;
}

export function splitSqlAlias(alias: string): string[] {
   return alias.split('$');
}

export function createNewFieldsToSelect<Fields>(): FieldsToSelect<Fields> {
   return new Map<
      string,
      {
         domainFieldname: keyof Fields;
         fullFieldToSelect: string;
         convertToDomain: (o: any) => any;
      }
   >();
}

export function commonFormat(field: string, operator: DatabaseOperator, value: number | string | number[]): string {
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

export const comparisonOperatorMap: ComparisonOperatorMap = {
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

export async function executeRequest(
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
