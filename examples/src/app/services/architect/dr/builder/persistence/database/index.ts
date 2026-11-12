import { MappingBuilder, OneToOneTableMapping, SelectMethod, Table, TableDef, TableMapping } from '/deps/index.ts';
import { DomainRequestName } from '@domains/types.ts';
import { Fields, Rater, Rating } from '../../../types.ts';

const tableDef: TableDef = {
   name: 'architects',
   primaryKey: 'id',
};

const raterTableDef: TableDef = {
   name: 'raters',
   primaryKey: 'id',
};
const raterMapping: TableMapping<keyof Rater> = new MappingBuilder<Rater, { name: string }>(
   raterTableDef,
   { name: '' },
   ['name'],
)
   .addAutoMapping('name')
   .build();

const ratingTableDef: TableDef = {
   name: 'ratings',
   primaryKey: 'id',
};
const ratingScalarMapping = new MappingBuilder<Pick<Rating, 'rate'>, { rate: string }>(ratingTableDef, { rate: '' }, [
   'rate',
])
   .addAutoMapping('rate')
   .build();

const ratingMapping: TableMapping<keyof Rating> = {
   ...ratingScalarMapping,
   rater: new OneToOneTableMapping(raterTableDef, raterMapping, `${ratingTableDef.name}.id_rater`),
};

const architectScalarMapping = new MappingBuilder<Pick<Fields, 'id' | 'name'>, { id: number; name: string }>(
   tableDef,
   { id: '', name: '' },
   ['id', 'name'],
)
   .addAutoMapping('id', 'name')
   .build();

const mapping: TableMapping<keyof Fields> = {
   ...architectScalarMapping,
   rating: new OneToOneTableMapping(ratingTableDef, ratingMapping, `${tableDef.name}.id_rating`),
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
