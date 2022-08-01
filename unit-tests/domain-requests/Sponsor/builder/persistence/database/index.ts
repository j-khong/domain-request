import {
   SimpleTableConfig,
   toTableId,
   toString,
   SimpleDatabaseTable,
   buildSameTableMapping,
} from '../../../../../../src/persistence/database/index.ts';
import { DomainRequestName } from '../../../../types.ts';
import { Fields } from '../../../types.ts';

type Key = 'id';
type TableFields = Key | 'name';

class Database extends SimpleDatabaseTable<DomainRequestName, Fields, TableFields> {
   constructor() {
      super(
         new SimpleTableConfig<Fields, TableFields>(
            'sponsors', // tableName
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
