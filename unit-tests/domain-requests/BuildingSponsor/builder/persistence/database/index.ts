import {
   buildExpandablesToTableMapping,
   buildSameTableMapping,
   DatabaseTableWithExpandables,
   DomainExpandableFieldsToTableFieldsMap,
   ExpandablesTableConfig,
   SimpleDatabaseTable,
   toTableId,
} from '../../../../../../src/persistence/database';
import { ExpandableFields, Fields } from '../../../types';
import { DomainRequestName } from '../../../../types';

type Key = 'id';
type TableFields = Key | 'id_building' | 'id_sponsor';

class Database extends DatabaseTableWithExpandables<DomainRequestName, Fields, ExpandableFields, TableFields> {
   constructor() {
      super(
         new ExpandablesTableConfig<Fields, ExpandableFields, TableFields>(
            'building_sponsors', // tableName
            'id', // tablePrimaryKey
            {
               id: buildSameTableMapping('id', toTableId, (o) => o.toString()),
               buildingId: buildSameTableMapping('id_building', toTableId, (o) => o.toString()),
               sponsorId: buildSameTableMapping('id_sponsor', toTableId, (o) => o.toString()),
            }, // domainFieldsToTableFieldsMap
         ),
      );
   }

   buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DomainRequestName]: SimpleDatabaseTable<DomainRequestName, Fields, TableFields>;
   }): DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields> {
      return {
         ...buildExpandablesToTableMapping({
            localContextDomainName: 'building',
            cardinality: { name: 'oneToOne', foreignKey: 'id_building' },
            allDbTables,
         }),
         ...buildExpandablesToTableMapping({
            localContextDomainName: 'sponsor',
            cardinality: { name: 'oneToOne', foreignKey: 'id_sponsor' },
            allDbTables,
         }),
      };
   }
}

export const dbTable = new Database();
