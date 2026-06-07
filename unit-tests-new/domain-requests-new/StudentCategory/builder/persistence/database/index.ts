import {
   TableDef,
   TableMapping,
   MappingBuilder,
   SelectMethod,
   Table,
} from '../../../../../../src/persistence/database/index.ts';
import { DomainRequestName } from '../../../../types.ts';
import { Fields } from '../../../types.ts';

const tableDef: TableDef = {
   name: 'student_categories',
   primaryKey: 'id',
};

const mapping: TableMapping<keyof Fields> = new MappingBuilder<
   Fields,
   { id: number; name: string; other_data: string }
>(tableDef, { id: '', name: '', otherData: '' }, ['id', 'name', 'other_data'])
   .addAutoMapping('id', 'name')
   .addAutoMappingWithOptions(['otherData'], {
      conventions: { explicit: { otherData: 'other_data' } },
      fieldKinds: { otherData: 'string' },
   })
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
