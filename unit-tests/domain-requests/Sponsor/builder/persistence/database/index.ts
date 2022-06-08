import {
   SimpleTableConfig,
   toTableId,
   toString,
   toNumber,
   SimpleDatabaseTable,
   buildSameTableMapping,
} from '../../../../../../src/persistence/database';
import { DomainRequestName } from '../../../../types';
import { Fields } from '../../../types';

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
