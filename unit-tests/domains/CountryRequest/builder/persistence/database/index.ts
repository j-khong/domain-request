import {
   DatabaseTable,
   DomainExpandableFieldsToTableFieldsMap,
   TableConfig,
   toString,
   toTableId,
} from '../../../../../../src/persistence/database';
import { DomainRequestName } from '../../../../types';
import { ExpandableFields, Fields } from '../../../types';

type Key = 'id';
type TableFields = Key | 'name' | 'timezone';
class Database extends DatabaseTable<DomainRequestName, Fields, ExpandableFields, TableFields> {
   constructor() {
      super(
         new TableConfig<Fields, ExpandableFields, TableFields>(
            'country', // tableName
            'id', // tablePrimaryKey
            {
               id: { name: 'id', convert: toTableId },
               name: { name: 'name', convert: toString },
               timezone: { name: 'timezone', convert: toString },
            }, // domainFieldsToTableFieldsMap
         ),
      );
   }
   buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DomainRequestName]: DatabaseTable<DomainRequestName, Fields, ExpandableFields, TableFields>;
   }): DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields> {
      return {};
   }
}

export const dbTable = new Database();
