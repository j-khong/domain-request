import {
   DomainExpandableFieldsToTableFieldsMap,
   TableConfig,
   toTableId,
   toString,
   DatabaseTable,
   toBoolean,
   DatabaseTableWithExpandables,
   buildSameTableMapping,
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
         new TableConfig<Fields, ExpandableFields, TableFields>(
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
      [Property in DomainRequestName]: DatabaseTable<DomainRequestName, Fields, ExpandableFields, TableFields>;
   }): DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields> {
      return {
         country: {
            cardinality: { name: 'oneToOne', foreignKey: 'id_country' },
            tableConfig: allDbTables.country.getTableConfig(),
            dbt: allDbTables.country,
         },
         category: {
            globalContextDomainName: 'studentCategory',
            cardinality: { name: 'oneToOne', foreignKey: 'id_category' },
            tableConfig: allDbTables.studentCategory.getTableConfig(),
            dbt: allDbTables.studentCategory,
         },
         courseApplication: {
            cardinality: { name: 'oneToMany' },
            tableConfig: allDbTables.courseApplication.getTableConfig(),
            dbt: allDbTables.courseApplication,
         },
      };
   }
}

export const dbTable = new Database();
