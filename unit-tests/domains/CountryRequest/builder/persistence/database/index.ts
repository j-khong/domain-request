import {
   DomainExpandableFieldsToTableFieldsMap,
   DomainFieldsToTableFieldsMap,
   fetch as fetchResults,
   SelectMethod,
   TableConfig,
   toString,
   toTableId,
} from '../../../../../../src/persistence/database';
import { ExpandableFields, Fields, Request, Result } from '../../../types';

export function fetch(req: Request): Promise<Result> {
   return fetchResults(tableConfig, req);
}

const tableName = 'country';
type Key = 'id';
const tablePrimaryKey: Key = 'id';

type TableFields = Key | 'name' | 'timezone';

const domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields> = {
   id: { name: 'id', convert: toTableId },
   name: { name: 'name', convert: toString },
   timezone: { name: 'timezone', convert: toString },
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
