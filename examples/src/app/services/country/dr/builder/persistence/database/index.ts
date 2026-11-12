import { MappingBuilder, SelectMethod, Table, TableDef, TableMapping } from '/deps/index.ts';
import { DomainRequestName } from '@domains/types.ts';
import { Fields } from '../../../types.ts';

const tableDef: TableDef = {
   name: 'countries',
   primaryKey: 'id',
};

const mapping: TableMapping<keyof Fields> = new MappingBuilder<Fields, { id: number; name: string; timezone: string }>(
   tableDef,
   { id: '', name: '', timezone: '' },
   ['id', 'name', 'timezone'],
)
   .addAutoMapping('id', 'name', 'timezone')
   .build();

export function getTableDefinition(): TableDef {
   return tableDef;
}

export function getTableMapping(): TableMapping<keyof Fields> {
   return mapping;
}

export function buildTableConnector(select: SelectMethod): Table<DomainRequestName> {
   return new Table(tableDef, mapping, select);
}
