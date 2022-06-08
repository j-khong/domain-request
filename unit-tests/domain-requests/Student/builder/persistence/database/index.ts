import {
   DomainExpandableFieldsToTableFieldsMap,
   toTableId,
   toString,
   toBoolean,
   DatabaseTableWithExpandables,
   buildSameTableMapping,
   ExpandablesTableConfig,
   SimpleDatabaseTable,
   buildExpandablesToTableMapping,
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
   | 'id_country'
   | 'id_category'
   | 'has_scholarship';

class Database extends DatabaseTableWithExpandables<DomainRequestName, Fields, ExpandableFields, TableFields> {
   constructor() {
      super(
         new ExpandablesTableConfig<Fields, ExpandableFields, TableFields>(
            'students', // tableName
            'id', // tablePrimaryKey
            {
               id: buildSameTableMapping('id', toTableId, (o) => o.toString()),
               firstname: buildSameTableMapping('firstname', toString),
               lastname: buildSameTableMapping('lastname', toString),
               yearOfBirth: buildSameTableMapping('year_of_birth', toString),
               nationalCardId: buildSameTableMapping('national_card_id', toString),
               countryId: buildSameTableMapping('id_country', toString),
               hasScholarship: buildSameTableMapping('has_scholarship', toBoolean),
               categoryId: buildSameTableMapping('id_category', toString),
            }, // domainFieldsToTableFieldsMap
         ),
      );
   }

   buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DomainRequestName]: SimpleDatabaseTable<DomainRequestName, Fields, TableFields>;
   }): DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields> {
      return {
         country: buildExpandablesToTableMapping({
            dbTable: allDbTables.country,
            cardinality: { name: 'oneToOne', foreignKey: 'id_country' },
         }),
         category: buildExpandablesToTableMapping({
            dbTable: allDbTables.studentCategory,
            cardinality: { name: 'oneToOne', foreignKey: 'id_category' },
            globalContextDomainName: 'studentCategory',
         }),
         courseApplication: buildExpandablesToTableMapping({
            cardinality: { name: 'oneToMany' },
            dbTable: allDbTables.courseApplication,
         }),
      };
   }
}

export const dbTable = new Database();
