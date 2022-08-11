import {
   SimpleTableConfig,
   SimpleDatabaseTable,
   createFieldMapping,
   buildMapping,
   DomainToDbTableMapping,
   ToDbSqlNumberConverter,
   ToDbSqlStringConverter,
} from '../../../../../mod.ts';
import { DomainRequestName } from '../../../../types.ts';
import { Fields } from '../../../types.ts';

interface Table {
   id: number;
   name: string;
}

type MappedType<F1 extends keyof Fields, T1 extends keyof Table> = DomainToDbTableMapping<
   Pick<Fields, F1>,
   Pick<Table, T1>
>;

const c: DomainToDbTableMapping<Fields, Table> = {
   ...(createFieldMapping('id', 'id', new ToDbSqlNumberConverter(), (o: any) => o.toString()) as MappedType<
      'id',
      'id'
   >),
   ...(createFieldMapping('name', 'name', new ToDbSqlStringConverter(), (o: any) => o) as MappedType<'name', 'name'>),
};
class Database extends SimpleDatabaseTable<DomainRequestName, Fields, keyof Table> {
   constructor() {
      super(
         new SimpleTableConfig<Fields, keyof Table>(
            'sponsors', // tableName
            'id', // tablePrimaryKey
            buildMapping(c), // domainFieldsToTableFieldsMap
         ),
      );
   }
}

export const dbTable = new Database();
