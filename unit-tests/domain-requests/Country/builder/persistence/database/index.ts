import {
   buildSameTableMapping,
   SimpleDatabaseTable,
   SimpleTableConfig,
   toString,
   toTableId,
} from '../../../../../../src/persistence/database/index.ts';
import { DomainRequestName } from '../../../../types.ts';
import { Fields } from '../../../types.ts';

type Key = 'id';
type TableFields = Key | 'name' | 'timezone';
class Database extends SimpleDatabaseTable<DomainRequestName, Fields, TableFields> {
   constructor() {
      super(
         new SimpleTableConfig<Fields, TableFields>(
            'countries', // tableName
            'id', // tablePrimaryKey
            {
               id: buildSameTableMapping('id', toTableId, (o) => o.toString()),
               name: buildSameTableMapping('name', toString),
               timezone: buildSameTableMapping('timezone', toString),
            }, // domainFieldsToTableFieldsMap
         ),
      );
   }
}

export const dbTable = new Database();
