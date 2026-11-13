import {
   TableDef,
   TableMapping,
   SameTableMapping,
   Dialect,
   SelectMethod,
   Table,
   ToDbSqlStringConverter,
   ToDbSqlNumberConverter,
   unknownToString,
} from '../../../../../../src/persistence/database/index.ts';
import { DomainRequestName } from '../../../../types.ts';
import { Fields } from '../../../types.ts';

const tableDef: TableDef = {
   name: 'building_categories',
   primaryKey: 'id',
};

const mapping: TableMapping<keyof Fields> = {
   id: new SameTableMapping(tableDef, 'id', new ToDbSqlNumberConverter(), unknownToString),
   name: new SameTableMapping(tableDef, 'name', new ToDbSqlStringConverter(), unknownToString),
};

export function getTableDefinition(): TableDef {
   return tableDef;
}

export function getTableMapping(): TableMapping<keyof Fields> {
   return mapping;
}

export function buildTableConnector(select: SelectMethod, dialect?: Dialect): Table<DomainRequestName> {
   return new Table(tableDef, mapping, select, { dialect });
}
