import {
   SimpleTableConfig,
   SimpleDatabaseTable,
   createFieldMapping,
   buildMapping,
   ValueMapper,
   ToDbSqlNumberConverter,
   ToDbSqlStringConverter,
   ToDbSqlDateConverter,
   ToDbSqlBooleanConverter,
   DomainToDbTableMapping,
} from '../../../../../mod.ts';
import { DomainRequestName } from '../../../../types.ts';
import { Fields, Status } from '../../../types.ts';

interface Table {
   id: number;
   name: string;
   published: Date;
   is_multilanguage: boolean;
   status: DbStatus;
   seats_max: number;
}

class ToDbSqlStatusConverter extends ToDbSqlStringConverter {
   constructor() {
      super(toDbStatus);
   }
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
   ...(createFieldMapping('name', 'name', new ToDbSqlStringConverter(), (o: any) => o.toString()) as MappedType<
      'name',
      'name'
   >),
   ...(createFieldMapping('publishedDate', 'published', new ToDbSqlDateConverter(), (o: any) => o) as MappedType<
      'publishedDate',
      'published'
   >),
   ...(createFieldMapping('maxSeats', 'seats_max', new ToDbSqlNumberConverter(), (o: any) => o) as MappedType<
      'maxSeats',
      'seats_max'
   >),
   ...(createFieldMapping(
      'isMultilanguage',
      'is_multilanguage',
      new ToDbSqlBooleanConverter(),
      (o: any) => o,
   ) as MappedType<'isMultilanguage', 'is_multilanguage'>),
   ...(createFieldMapping('status', 'status', new ToDbSqlStatusConverter(), toDomainStatus) as MappedType<
      'status',
      'status'
   >),
};

type DbStatus = 'o' | 'v' | 'p' | 'c';
const dbToDomain = new Map<DbStatus, Status>([
   ['o', 'opened'],
   ['v', 'validating'],
   ['p', 'pending'],
   ['c', 'closed'],
]);
const statusValueMapper = new ValueMapper<DbStatus, Status>(dbToDomain);

function toDbStatus(o: unknown): string {
   return statusValueMapper.toDbValue(o as any, '' as DbStatus);
}

function toDomainStatus(o: any): Status {
   return statusValueMapper.toDomainValue(o, 'closed');
}

class Database extends SimpleDatabaseTable<DomainRequestName, Fields, keyof Table> {
   constructor() {
      super(
         new SimpleTableConfig<Fields, keyof Table>(
            'courses', // tableName
            'id', // tablePrimaryKey
            buildMapping(c), // domainFieldsToTableFieldsMap
         ),
      );
   }
}

export const dbTable = new Database();
