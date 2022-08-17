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
} from '../../../../../mod.ts';
import { DomainRequestName } from '../../../../types.ts';
import { Fields, ExpandableFields } from '../../../types.ts';

interface Table {
   id: number;
   id_building: number;
   id_sponsor: number;
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
   ...(createFieldMapping('buildingId', 'id_building', new ToDbSqlNumberConverter(), (o: any) =>
      o.toString(),
   ) as MappedType<'buildingId', 'id_building'>),
   ...(createFieldMapping('sponsorId', 'id_sponsor', new ToDbSqlNumberConverter(), (o: any) =>
      o.toString(),
   ) as MappedType<'sponsorId', 'id_sponsor'>),
};
class Database extends DatabaseTableWithExpandables<DomainRequestName, Fields, ExpandableFields, keyof Table> {
   constructor() {
      super(
         new ExpandablesTableConfig<Fields, ExpandableFields, keyof Table>(
            'building_sponsors', // tableName
            'id', // tablePrimaryKey
            buildMapping(c), // domainFieldsToTableFieldsMap
         ),
      );
   }

   buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DomainRequestName]: SimpleDatabaseTable<DomainRequestName, Fields, keyof Table>;
   }): DomainExpandableFieldsToTableFieldsMap<ExpandableFields, keyof Table> {
      return {
         building: buildExpandablesToTableMapping({
            globalContextDomainName: 'building',
            cardinality: { name: 'oneToOne', foreignKey: 'id_building' },
            allDbTables,
         }),
         sponsor: buildExpandablesToTableMapping({
            globalContextDomainName: 'sponsor',
            cardinality: { name: 'oneToOne', foreignKey: 'id_sponsor' },
            allDbTables,
         }),
      };
   }
}

export const dbTable = new Database();
