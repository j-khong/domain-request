import {
   DomainExpandableFieldsToTableFieldsMap,
   DomainFieldsToTableFieldsMap,
   fetch as fetchResults,
   SelectMethod,
   TableConfig,
   toTableId,
   toString,
} from '../../../../../../src/persistence/database';
import { ExpandableFields, Fields, Request, Result } from '../../../types';

export async function fetch(req: Request): Promise<Result> {
   return fetchResults(tableConfig, req);
}

const tableName = 'course';
type Key = 'id';
const tablePrimaryKey: Key = 'id';

type TableFields = Key | 'name';

const domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields> = {
   id: { name: 'id', convert: toTableId },
   name: { name: 'name', convert: toString },
};

export const tableConfig = new TableConfig<Fields, ExpandableFields, TableFields>(
   tableName,
   tablePrimaryKey,
   domainFieldsToTableFieldsMap,
);

export function init(select: SelectMethod): void {
   const domainExpandableFieldsToTable: DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields> = {};
   tableConfig.init(domainExpandableFieldsToTable, select);
}
