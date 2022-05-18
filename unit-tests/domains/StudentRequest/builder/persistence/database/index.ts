import {
   DomainExpandableFieldsToTableFieldsMap,
   TableConfig,
   toTableId,
   toString,
   DatabaseTable,
} from '../../../../../../src/persistence/database';
import { ExpandableFields, Fields } from '../../../types';
import { DomainRequestName } from '../../../../types';

type Key = 'id';
type TableFields =
   | Key
   | 'firstname'
   | 'lastname'
   | 'year_of_birth'
   | 'national_card_id'
   | 'country_id'
   | 'category_id'
   | 'has_scholarship';

class Database extends DatabaseTable<DomainRequestName, Fields, ExpandableFields, TableFields> {
   constructor() {
      super(
         new TableConfig<Fields, ExpandableFields, TableFields>(
            'student', // tableName
            'id', // tablePrimaryKey
            {
               id: { name: 'id', convert: toTableId },
               firstname: { name: 'firstname', convert: toString },
               lastname: { name: 'lastname', convert: toString },
               yearOfBirth: { name: 'year_of_birth', convert: toString },
               nationalCardId: { name: 'national_card_id', convert: toString },
               countryId: { name: 'country_id', convert: toString },
               hasScholarship: { name: 'has_scholarship', convert: toString },
               categoryId: { name: 'category_id', convert: toString },
            }, // domainFieldsToTableFieldsMap
         ),
      );
   }
   buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DomainRequestName]: DatabaseTable<DomainRequestName, Fields, ExpandableFields, TableFields>;
   }): DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields> {
      return {
         country: {
            cardinality: { name: 'oneToOne', foreignKey: 'country_id' },
            tableConfig: allDbTables.country.getTableConfig(),
         },
         category: {
            cardinality: { name: 'oneToOne', foreignKey: 'category_id' },
            tableConfig: allDbTables.studentCategory.getTableConfig(),
         },
         courseApplication: {
            cardinality: { name: 'oneToMany' },
            tableConfig: allDbTables.courseApplication.getTableConfig(),
         },
      };
   }
}

export const dbTable = new Database();
