import { SelectMethod, SelectMethodResult } from './TableConfig';
import { FieldsToSelect } from './types';

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
