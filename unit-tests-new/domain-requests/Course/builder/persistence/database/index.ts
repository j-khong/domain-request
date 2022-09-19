import {
   TableDef,
   TableMapping,
   SameTableMapping,
   SelectMethod,
   Table,
   ToDbSqlNumberConverter,
   ToDbSqlStringConverter,
   ToDbSqlBooleanConverter,
   ToDbSqlDateConverter,
   ValueMapper,
   unknownToString,
   unknownToBoolean,
   unknownToIsoDate,
   unknownToNumber,
} from '../../../../../mod.ts';

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

const mapping: TableMapping<keyof Fields> = {
   id: new SameTableMapping(tableDef, 'id', new ToDbSqlNumberConverter(), unknownToString),
   name: new SameTableMapping(tableDef, 'name', new ToDbSqlStringConverter(), unknownToString),
   publishedDate: new SameTableMapping(tableDef, 'published', new ToDbSqlDateConverter(), unknownToIsoDate),
   isMultilanguage: new SameTableMapping(tableDef, 'is_multilanguage', new ToDbSqlBooleanConverter(), unknownToBoolean),
   status: new SameTableMapping(tableDef, 'status', new ToDbSqlStatusConverter(), toDomainStatus),
   maxSeats: new SameTableMapping(tableDef, 'seats_max', new ToDbSqlNumberConverter(), unknownToNumber),
};

export function buildTableConnector(select: SelectMethod): Table<DomainRequestName> {
   return new Table(tableDef, mapping, select);
}
