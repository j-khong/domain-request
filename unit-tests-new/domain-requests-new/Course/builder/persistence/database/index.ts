import {
   TableDef,
   TableMapping,
   MappingBuilder,
   SameTableMapping,
   Dialect,
   SelectMethod,
   Table,
   ToDbSqlStringConverter,
   ValueMapper,
} from '../../../../../../src/persistence/database/index.ts';

import { DomainRequestName } from '../../../../types.ts';
import { Status, Fields } from '../../../types.ts';

const tableDef: TableDef = {
   name: 'courses',
   primaryKey: 'id',
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
   return statusValueMapper.toDbValue(o as Status, '' as DbStatus);
}

function toDomainStatus(o: unknown): Status {
   return statusValueMapper.toDomainValue(o as DbStatus, 'closed');
}

class ToDbSqlStatusConverter extends ToDbSqlStringConverter {
   constructor() {
      super(toDbStatus);
   }
}

const scalarMapping = new MappingBuilder<
   Pick<Fields, 'id' | 'name' | 'publishedDate' | 'isMultilanguage' | 'maxSeats'>,
   {
      id: number;
      name: string;
      published: string;
      is_multilanguage: boolean;
      seats_max: number;
   }
>(
   tableDef,
   {
      id: '',
      name: '',
      publishedDate: '',
      isMultilanguage: false,
      maxSeats: 0,
   },
   ['id', 'name', 'published', 'is_multilanguage', 'seats_max'],
)
   .addAutoMapping('id', 'name')
   .addAutoMappingWithOptions(['publishedDate', 'isMultilanguage', 'maxSeats'], {
      conventions: {
         explicit: {
            publishedDate: 'published',
            isMultilanguage: 'is_multilanguage',
            maxSeats: 'seats_max',
         },
      },
      fieldKinds: {
         publishedDate: 'isoDate',
         isMultilanguage: 'boolean',
         maxSeats: 'number',
      },
   })
   .build();

const mapping: TableMapping<keyof Fields> = {
   ...scalarMapping,
   status: new SameTableMapping(tableDef, 'status', new ToDbSqlStatusConverter(), toDomainStatus),
};

export function buildTableConnector(select: SelectMethod, dialect?: Dialect): Table<DomainRequestName> {
   return new Table(tableDef, mapping, select, { dialect });
}
