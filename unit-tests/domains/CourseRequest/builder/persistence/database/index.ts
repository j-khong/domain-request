import {
   DomainExpandableFieldsToTableFieldsMap,
   DomainFieldsToTableFieldsMap,
   fetch as fetchResults,
   SelectMethod,
   TableConfig,
   toNumber,
   toString,
} from '../../../../../../src/persistence/database';
import { ExpandableFields, Fields, Request, Result } from '../../../types';

export function fetch(req: Request): Result {
   const r = fetchResults(tableConfig, req);
   return {};
}

const tableName = 'course';
type Key = 'id';
const tablePrimaryKey: Key = 'id';

type TableFields = Key | 'name';

const domainFieldsToTableFieldsMap: DomainFieldsToTableFieldsMap<Fields, TableFields> = {
   id: { name: 'id', convert: toNumber },
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
