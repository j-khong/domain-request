import { Operator } from '../../DomainRequest/index.ts';
import {
   AndArrayComparison,
   Comparison,
   isAndArrayComparison,
   isOrArrayComparison,
   OrArrayComparison,
   SimpleDomainRequest,
} from '../../index.ts';
import {
   DbRecord,
   SameTableMapping,
   SelectMethod,
   SelectMethodResult,
   SimpleTableConfig,
   ToDbSqlConverter,
} from './TableConfig.ts';
import { FieldsToSelect, Join } from './types.ts';

export function getFieldsToSelect<DRN extends string, Fields, TableFields extends string>(
   tableConfig: SimpleTableConfig<Fields, TableFields>,
   req: SimpleDomainRequest<DRN, Fields>,
): {
   hasSelected: boolean;
   fields: FieldsToSelect<Fields>;
   joins: Join;
} {
   const toComputeList = req.getFieldsToCompute();

   const fields = createNewFieldsToSelect<Fields>();
   for (const v of req.getFieldsNames()) {
      const mapping = getDomainFieldsToTableFieldsMapping(tableConfig, v as keyof Fields);

      const toComputeData = toComputeList.get(v as Extract<keyof Fields, string>);
      if (toComputeData !== undefined) {
         addFieldToSelect<Fields>(
            fields,
            tableConfig.tableName,
            mapping.name,
            v,
            mapping.convertToDomain,
            (t: string, f: string): string => {
               return `${mapping.convertToCompute(toComputeData)} AS ${createSqlAlias(t, f)}`;
            },
         );
      } else {
         addFieldToSelect<Fields>(fields, tableConfig.tableName, mapping.name, v, mapping.convertToDomain);
      }
   }
   return { fields, hasSelected: fields.size > 0, joins: new Map() };
}

export function addFieldToSelect<Fields>(
   m: FieldsToSelect<Fields>,
   tableName: string,
   fieldName: string,
   key: keyof Fields,
   convertToDomain: (o: any) => any,
   createRequestFullFieldNameCB: (t: string, f: string) => string = createRequestFullFieldName,
): void {
   m.set(createSqlAlias(tableName, fieldName), {
      fullFieldToSelect: createRequestFullFieldNameCB(tableName, fieldName),
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
   const res = [];
   let error: string | undefined;
   try {
      const tmp = await select(sql); // TODO try catch and add error to report
      res.push(...tmp);
   } catch (e) {
      error = e.message;
   }
   const end = new Date();
   const report = {
      sql: sql,
      timeInMs: end.getTime() - start.getTime(),
      error,
   };
   return { res, report };
}

export function processFilters<DRN extends string, F, TF extends string>(
   tableConfig: SimpleTableConfig<F, TF>,
   req: SimpleDomainRequest<DRN, F>,
): string[] {
   const filters = req.getFilters();
   const result: string[] = [];
   const toComputeList = req.getFieldsToCompute();

   for (const key in filters) {
      const fieldMapper = getDomainFieldsToTableFieldsMapping(tableConfig, key);
      const comparison = filters[key];
      if (comparison === undefined) {
         continue;
      }

      let fieldName = `${tableConfig.tableName}.${fieldMapper.name}`;
      const toComputeData = toComputeList.get(key);
      if (toComputeData !== undefined) {
         fieldName = `${fieldMapper.convertToCompute(toComputeData)}`;
      }

      const populateValue = (c: Comparison<F>, result: string[]): void => {
         const comparisonMapper = comparisonOperatorMap[c.operator];
         fieldMapper.convertToDb.setValue(c.value);
         result.push(comparisonMapper.format(fieldName, fieldMapper.convertToDb));
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

type DatabaseOperator = '=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'IN' | 'BETWEEN';

function commonFormat(
   field: string,
   operator: DatabaseOperator,
   converter: ToDbSqlConverter<unknown>,
   deco?: string,
): string {
   const buildInstruction = (v: unknown) => `${field} ${operator} ${v}`;

   return converter
      .getValue()
      .map((v) => buildInstruction(converter.prepare(v, deco)))
      .join(' OR ');
}

type ComparisonOperatorMap = {
   [key in Operator]: {
      format: (field: string, converter: ToDbSqlConverter<unknown>) => string;
   };
};

const comparisonOperatorMap: ComparisonOperatorMap = {
   equals: {
      format: (field: string, converter: ToDbSqlConverter<unknown>): string => commonFormat(field, '=', converter),
   },
   greaterThan: {
      format: (field: string, converter: ToDbSqlConverter<unknown>): string => commonFormat(field, '>', converter),
   },
   greaterThanOrEquals: {
      format: (field: string, converter: ToDbSqlConverter<unknown>): string => commonFormat(field, '>=', converter),
   },
   lesserThan: {
      format: (field: string, converter: ToDbSqlConverter<unknown>): string => commonFormat(field, '<', converter),
   },
   lesserThanOrEquals: {
      format: (field: string, converter: ToDbSqlConverter<unknown>): string => commonFormat(field, '<=', converter),
   },
   contains: {
      format: (field: string, converter: ToDbSqlConverter<unknown>): string =>
         commonFormat(field, 'LIKE', converter, '%'),
   },
   isIn: {
      format: (field: string, converter: ToDbSqlConverter<unknown>): string => {
         return commonFormat(field, 'IN', converter);
      },
   },
   between: {
      format: (field: string, converter: ToDbSqlConverter<unknown>): string => {
         const buildInstruction = (v: unknown) => `${field} BETWEEN ${v}`;

         const values = converter.getValue();
         if (values.length === 1) {
            const v = converter.prepare(values[0]);
            return buildInstruction(`${v} AND ${v}`);
         } else if (values.length >= 2) {
            return buildInstruction(`${converter.prepare(values[0])} AND ${converter.prepare(values[1])}`);
         } else {
            return buildInstruction('0 AND 0');
         }
      },
   },
};

export function createResultAndPopulate<F>(
   dbRecord: DbRecord,
   fieldsToSelect: FieldsToSelect<F>,
): { [key: string]: string } {
   const result: { [key: string]: string } = {};
   for (const key of fieldsToSelect.keys()) {
      const fieldToSelect = fieldsToSelect.get(key);
      if (fieldToSelect !== undefined) {
         result[fieldToSelect.domainFieldname as Extract<keyof F, string>] = fieldToSelect.convertToDomain(
            dbRecord[key],
         );
      }
   }
   return result;
}
