import {
   TableDef,
   TableMapping,
   SameTableMapping,
   SelectMethod,
   Table,
   ToDbSqlNumberConverter,
   ToDbSqlStringConverter,
   unknownToString,
   OneToOneTableMapping,
} from '../../../../../mod2.ts';
import { DomainRequestName } from '../../../../types.ts';
import { Fields, Rating, Rater } from '../../../types.ts';

const tableDef: TableDef = {
   name: 'architects',
   primaryKey: 'id',
};

const raterTableDef: TableDef = {
   name: 'raters',
   primaryKey: 'id',
};
const raterMapping: TableMapping<keyof Rater> = {
   name: new SameTableMapping(raterTableDef, 'name', new ToDbSqlStringConverter(), unknownToString),
};

const ratingTableDef: TableDef = {
   name: 'ratings',
   primaryKey: 'id',
};
const ratingMapping: TableMapping<keyof Rating> = {
   rate: new SameTableMapping(ratingTableDef, 'rate', new ToDbSqlStringConverter(), unknownToString),
   rater: new OneToOneTableMapping(raterTableDef, raterMapping, `${ratingTableDef.name}.id_rater`),
};

const mapping: TableMapping<keyof Fields> = {
   id: new SameTableMapping(tableDef, 'id', new ToDbSqlNumberConverter(), unknownToString),
   name: new SameTableMapping(tableDef, 'name', new ToDbSqlStringConverter(), unknownToString),
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
