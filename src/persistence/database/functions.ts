import {
   AndArrayComparison,
   Comparison,
   isAndArrayComparison,
   isOrArrayComparison,
   OrArrayComparison,
   SimpleDomainRequest,
} from '../..';
import { DbRecord, SameTableMapping, SelectMethod, SelectMethodResult, SimpleTableConfig } from './TableConfig';
import { ComparisonOperatorMap, DatabaseOperator, FieldsToSelect, Join } from './types';

export function getFieldsToSelect<DRN extends string, Fields, TableFields extends string>(
   tableConfig: SimpleTableConfig<Fields, TableFields>,
   req: SimpleDomainRequest<DRN, Fields>,
): {
   hasSelected: boolean;
   fields: FieldsToSelect<Fields>;
   joins: Join;
} {
   const fields = createNewFieldsToSelect<Fields>();
   for (const v of req.getFieldsNames()) {
      const mapping = getDomainFieldsToTableFieldsMapping(tableConfig, v);

      addFieldToSelect(fields, tableConfig.tableName, mapping.name, v, mapping.convertToDomain);
   }
   return { fields, hasSelected: fields.size > 0, joins: new Map() };
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

const aliasSep = '$';
export function createSqlAlias(tableName: string, fieldName: string): string {
   return `${tableName}${aliasSep}${fieldName}`;
}

export function splitSqlAlias(alias: string): string[] {
   return alias.split(aliasSep);
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

export function processFilters<DRN extends string, F, TF extends string>(
   tableConfig: SimpleTableConfig<F, TF>,
   req: SimpleDomainRequest<DRN, F>,
): string[] {
   const filters = req.getFilters();
   const result: string[] = [];

   for (const key in filters) {
      const fieldMapper = getDomainFieldsToTableFieldsMapping(tableConfig, key);
      const comparison = filters[key];
      if (comparison === undefined) {
         continue;
      }

      const populateValue = (c: Comparison<F>, result: string[]): void => {
         const comparisonMapper = comparisonOperatorMap[c.operator];
         result.push(
            comparisonMapper.format(`${tableConfig.tableName}.${fieldMapper.name}`, fieldMapper.convertToDb(c.value)),
         );
      };
      const populateFromArray = (arr: Array<Comparison<F>>, result: string[], link: 'AND' | 'OR'): void => {
         if (arr !== undefined && arr.length > 0) {
            const res: string[] = [];
            for (const comp of arr) {
               populateValue(comp, res);
            }
            result.push(`(${res.join(` ${link} `)})`);
         }
      };
      const populate = (c: AndArrayComparison<F> | OrArrayComparison<F>): void => {
         if (isAndArrayComparison(c)) {
            populateFromArray(c.and as Array<Comparison<F>>, result, 'AND');
         } else if (isOrArrayComparison(c)) {
            populateFromArray(c.or as Array<Comparison<F>>, result, 'OR');
         }
      };

      populate(comparison);
   }

   return result;
}
export function getDomainFieldsToTableFieldsMapping<Fields, TableFields extends string>(
   tableConfig: SimpleTableConfig<Fields, TableFields>,
   key: keyof Fields,
): SameTableMapping<TableFields> {
   const mapping: SameTableMapping<TableFields> = tableConfig.domainFieldsToTableFieldsMap[key];
   if (mapping === undefined) {
      throw new Error(`configuration problem: no field [${key as string}] in domain to db field mapping`);
   }

   return mapping;
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

export function createResultAndPopulate<F>(dbRecord: DbRecord, fieldsToSelect: FieldsToSelect<F>): any {
   const result: any = {};
   for (const key of fieldsToSelect.keys()) {
      const fieldToSelect = fieldsToSelect.get(key);
      const fieldName = fieldToSelect !== undefined ? fieldToSelect.domainFieldname : '';
      result[fieldName] = fieldToSelect?.convertToDomain(dbRecord[key]);
   }
   return result;
}
