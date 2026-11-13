import {
   TableDef,
   TableMapping,
   MappingBuilder,
   SameTableMapping,
   OneToOneTableMapping,
   Dialect,
   SelectMethod,
   Table,
} from '../../../../../../src/persistence/database/index.ts';
import { DomainRequestName } from '../../../../types.ts';
import { Fields } from '../../../types.ts';
import * as Country from '../../../../Country/builder/persistence/database/index.ts';
import * as StudentCategory from '../../../../StudentCategory/builder/persistence/database/index.ts';

const tableDef: TableDef = {
   name: 'students',
   primaryKey: 'id',
};

const scalarMapping = new MappingBuilder<
   Pick<Fields, 'id' | 'firstname' | 'lastname' | 'yearOfBirth' | 'nationalCardId' | 'hasScholarship'>,
   {
      id: number;
      firstname: string;
      lastname: string;
      year_of_birth: number;
      national_card_id: string;
      has_scholarship: boolean;
   }
>(
   tableDef,
   {
      id: '',
      firstname: '',
      lastname: '',
      yearOfBirth: 0,
      nationalCardId: '',
      hasScholarship: false,
   },
   ['id', 'firstname', 'lastname', 'year_of_birth', 'national_card_id', 'has_scholarship'],
)
   .addAutoMapping('id', 'firstname', 'lastname')
   .addAutoMappingWithOptions(['yearOfBirth', 'nationalCardId', 'hasScholarship'], {
      conventions: {
         explicit: {
            yearOfBirth: 'year_of_birth',
            nationalCardId: 'national_card_id',
            hasScholarship: 'has_scholarship',
         },
      },
      fieldKinds: {
         yearOfBirth: 'number',
         nationalCardId: 'string',
         hasScholarship: 'boolean',
      },
   })
   .build();

const mapping: TableMapping<keyof Fields> = {
   ...scalarMapping,
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
