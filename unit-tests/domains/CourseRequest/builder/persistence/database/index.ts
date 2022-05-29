import { TableConfig, toTableId, toString, DatabaseTable } from '../../../../../../src/persistence/database';
import { DomainRequestName } from '../../../../types';
import { ExpandableFields, Fields } from '../../../types';

type Key = 'id';
type TableFields = Key | 'name';

class Database extends DatabaseTable<DomainRequestName, Fields, ExpandableFields, TableFields> {
   constructor() {
      super(
         new TableConfig<Fields, ExpandableFields, TableFields>(
            'courses', // tableName
            'id', // tablePrimaryKey
            {
               id: { name: 'id', convert: toTableId },
               name: { name: 'name', convert: toString },
            }, // domainFieldsToTableFieldsMap
         ),
      );
   }
}

export const dbTable = new Database();
