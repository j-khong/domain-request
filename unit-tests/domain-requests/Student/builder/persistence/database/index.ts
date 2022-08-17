import {
   buildExpandablesToTableMapping,
   buildMapping,
   DatabaseTableWithExpandables,
   DomainExpandableFieldsToTableFieldsMap,
   ExpandablesTableConfig,
   SimpleDatabaseTable,
   DomainToDbTableMapping,
   createFieldMapping,
   ToDbSqlNumberConverter,
   ToDbSqlStringConverter,
   ToDbSqlBooleanConverter,
} from '../../../../../mod.ts';
import { DomainRequestName } from '../../../../types.ts';
import { Fields, ExpandableFields } from '../../../types.ts';

interface Table {
   id: number;
   firstname: string;
   lastname: string;
   year_of_birth: number;
   national_card_id: string;
   id_country: number;
   id_category: number;
   has_scholarship: boolean;
   distance_from: number;
}

type MappedType<F1 extends keyof Fields, T1 extends keyof Table> = DomainToDbTableMapping<
   Pick<Fields, F1>,
   Pick<Table, T1>
>;

const c: DomainToDbTableMapping<Fields, Table> = {
   ...(createFieldMapping('id', 'id', new ToDbSqlNumberConverter(), (o: any) => o.toString()) as MappedType<
      'id',
      'id'
   >),
   ...(createFieldMapping('firstname', 'firstname', new ToDbSqlStringConverter(), (o: any) =>
      o.toString(),
   ) as MappedType<'firstname', 'firstname'>),
   ...(createFieldMapping('lastname', 'lastname', new ToDbSqlStringConverter(), (o: any) => o.toString()) as MappedType<
      'lastname',
      'lastname'
   >),
   ...(createFieldMapping('yearOfBirth', 'year_of_birth', new ToDbSqlNumberConverter(), (o: any) => o) as MappedType<
      'yearOfBirth',
      'year_of_birth'
   >),
   ...(createFieldMapping('nationalCardId', 'national_card_id', new ToDbSqlStringConverter(), (o: any) =>
      o.toString(),
   ) as MappedType<'nationalCardId', 'national_card_id'>),
   ...(createFieldMapping('countryId', 'id_country', new ToDbSqlNumberConverter(), (o: any) =>
      o.toString(),
   ) as MappedType<'countryId', 'id_country'>),
   ...(createFieldMapping('categoryId', 'id_category', new ToDbSqlNumberConverter(), (o: any) =>
      o.toString(),
   ) as MappedType<'categoryId', 'id_category'>),
   ...(createFieldMapping(
      'hasScholarship',
      'has_scholarship',
      new ToDbSqlBooleanConverter(),
      (o: any) => o,
   ) as MappedType<'hasScholarship', 'has_scholarship'>),
   ...(createFieldMapping('distanceFrom', 'distance_from', new ToDbSqlNumberConverter(), (intputValues: any) => {
      return `( 6371 * acos( cos(radians(${intputValues.latitude})) * cos(radians(year_of_birth)) * cos( radians(year_of_birth) - radians(${intputValues.longitude}) ) + sin(radians(${intputValues.latitude})) * sin(radians(year_of_birth)) ) )`;
   }) as MappedType<'distanceFrom', 'distance_from'>),
};

class Database extends DatabaseTableWithExpandables<DomainRequestName, Fields, ExpandableFields, keyof Table> {
   constructor() {
      super(
         new ExpandablesTableConfig<Fields, ExpandableFields, keyof Table>(
            'students', // tableName
            'id', // tablePrimaryKey
            buildMapping(c), // domainFieldsToTableFieldsMap
         ),
      );
   }

   buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DomainRequestName]: SimpleDatabaseTable<DomainRequestName, Fields, keyof Table>;
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
