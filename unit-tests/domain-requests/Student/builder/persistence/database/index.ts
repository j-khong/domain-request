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
   toNumber,
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
   | 'has_scholarship'
   | 'distance_from';

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
               yearOfBirth: buildSameTableMapping('year_of_birth', toNumber),
               nationalCardId: buildSameTableMapping('national_card_id', toString),
               countryId: buildSameTableMapping('id_country', toString),
               hasScholarship: buildSameTableMapping('has_scholarship', toBoolean),
               categoryId: buildSameTableMapping('id_category', toString),
               distanceFrom: buildSameTableMapping(
                  'distance_from',
                  toNumber,
                  (o: any) => o,
                  (intputValues: any) => {
                     // return `( 6371 * acos( cos(radians(${intputValues.latitude})) * cos(radians(latitude)) * cos( radians(longitude) - radians(${intputValues.longitude}) ) + sin(radians(${intputValues.latitude})) * sin(radians(latitude)) ) )`;
                     return `( 6371 * acos( cos(radians(${intputValues.latitude})) * cos(radians(year_of_birth)) * cos( radians(year_of_birth) - radians(${intputValues.longitude}) ) + sin(radians(${intputValues.latitude})) * sin(radians(year_of_birth)) ) )`;
                  },
               ),
            }, // domainFieldsToTableFieldsMap
         ),
      );
   }

   buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DomainRequestName]: SimpleDatabaseTable<DomainRequestName, Fields, TableFields>;
   }): DomainExpandableFieldsToTableFieldsMap<ExpandableFields, any> {
      return {
         country: buildExpandablesToTableMapping({
            globalContextDomainName: 'country',
            allDbTables,
            cardinality: { name: 'oneToOne', foreignKey: 'id_country' },
         }),
         category: buildExpandablesToTableMapping({
            localContextDomainName: 'category',
            globalContextDomainName: 'studentCategory',
            allDbTables,
            cardinality: { name: 'oneToOne', foreignKey: 'id_category' },
         }),
         courseApplication: buildExpandablesToTableMapping({
            globalContextDomainName: 'courseApplication',
            cardinality: { name: 'oneToMany' },
            allDbTables,
         }),
      };
   }
}

export const dbTable = new Database();
