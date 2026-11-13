import {
   TableDef,
   TableMapping,
   SameTableMapping,
   OneToOneTableMapping,
   Dialect,
   SelectMethod,
   Table,
   ToDbSqlNumberConverter,
   ToDbSqlStringConverter,
   ToDbSqlBooleanConverter,
   unknownToString,
   unknownToNumber,
   unknownToBoolean,
} from '../../../../../../src/persistence/database/index.ts';
import { DomainRequestName } from '../../../../types.ts';
import { Fields } from '../../../types.ts';
import * as Country from '../../../../Country/builder/persistence/database/index.ts';
import * as StudentCategory from '../../../../StudentCategory/builder/persistence/database/index.ts';

const tableDef: TableDef = {
   name: 'students',
   primaryKey: 'id',
};

const mapping: TableMapping<keyof Fields> = {
   id: new SameTableMapping(tableDef, 'id', new ToDbSqlNumberConverter(), unknownToString),
   firstname: new SameTableMapping(tableDef, 'firstname', new ToDbSqlStringConverter(), unknownToString),
   lastname: new SameTableMapping(tableDef, 'lastname', new ToDbSqlStringConverter(), unknownToString),
   yearOfBirth: new SameTableMapping(tableDef, 'year_of_birth', new ToDbSqlNumberConverter(), unknownToNumber),
   nationalCardId: new SameTableMapping(tableDef, 'national_card_id', new ToDbSqlStringConverter(), unknownToString),
   hasScholarship: new SameTableMapping(tableDef, 'has_scholarship', new ToDbSqlBooleanConverter(), unknownToBoolean),
   country: new OneToOneTableMapping(
      Country.getTableDefinition(),
      Country.getTableMapping(),
      `${tableDef.name}.id_country`,
   ),
   category: new OneToOneTableMapping(
      StudentCategory.getTableDefinition(),
      StudentCategory.getTableMapping(),
      `${tableDef.name}.id_category`,
   ),
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
