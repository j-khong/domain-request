import {
   SameTableMapping,
   SelectMethod,
   Table,
   TableDef,
   TableMapping,
   ToDbSqlNumberConverter,
   ToDbSqlStringConverter,
   unknownToString,
} from '/deps/index.ts';
import { DomainRequestName } from '/app/domains/types.ts';
import { Fields } from '../../../types.ts';

const tableDef: TableDef = {
   name: 'countries',
   primaryKey: 'id',
};

const mapping: TableMapping<keyof Fields> = {
   id: new SameTableMapping(tableDef, 'id', new ToDbSqlNumberConverter(), unknownToString),
   name: new SameTableMapping(tableDef, 'name', new ToDbSqlStringConverter(), unknownToString),
   timezone: new SameTableMapping(tableDef, 'timezone', new ToDbSqlStringConverter(), unknownToString),
};

export function getTableDefinition(): TableDef {
   return tableDef;
}

export function getTableMapping(): TableMapping<keyof Fields> {
   return mapping;
}

export function buildTableConnector(select: SelectMethod): Table<DomainRequestName> {
   return new Table(tableDef, mapping, select);
}
