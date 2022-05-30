import { SimpleDatabaseTable, TableConfig, toString, toTableId } from '../../../../../../src/persistence/database';
import { DomainRequestName } from '../../../../types';
import { ExpandableFields, Fields } from '../../../types';

type Key = 'id';
type TableFields = Key | 'name';
class Database extends SimpleDatabaseTable<DomainRequestName, Fields, ExpandableFields, TableFields> {
   constructor() {
      super(
         new TableConfig<Fields, ExpandableFields, TableFields>(
            'student_categories', // tableName
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
