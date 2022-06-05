import {
   buildSameTableMapping,
   SimpleDatabaseTable,
   SimpleTableConfig,
   toString,
   toTableId,
} from '../../../../../../src/persistence/database';
import { DomainRequestName } from '../../../../types';
import { Fields } from '../../../types';

type Key = 'id';
type TableFields = Key | 'name';
class Database extends SimpleDatabaseTable<DomainRequestName, Fields, TableFields> {
   constructor() {
      super(
         new SimpleTableConfig<Fields, TableFields>(
            'student_categories', // tableName
            'id', // tablePrimaryKey
            {
               id: buildSameTableMapping('id', toTableId, (o) => o.toString()),
               name: buildSameTableMapping('name', toString),
            }, // domainFieldsToTableFieldsMap
         ),
      );
   }
}

export const dbTable = new Database();
