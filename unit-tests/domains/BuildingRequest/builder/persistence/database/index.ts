import {
   DatabaseTable,
   DomainExpandableFieldsToTableFieldsMap,
   SelectMethod,
   TableConfig,
   toNumber,
   toString,
   toTableId,
} from '../../../../../../src/persistence/database';
import { DomainRequestName } from '../../../../types';
import { ExpandableFields, Fields } from '../../../types';

const openingHoursTable = new TableConfig<{}, { building: {} }, 'id' | 'day' | 'start' | 'end' | 'building_id'>(
   'building_opening_hours', // tableName
   'id', // tablePrimaryKey
   {
      id: { name: 'id', convert: toTableId },
      day: { name: 'day', convert: toNumber },
      start: { name: 'start', convert: toString },
      end: { name: 'end', convert: toString },
   }, // domainFieldsToTableFieldsMap
);

type Key = 'id';
type TableFields = Key | 'name';
class Database extends DatabaseTable<DomainRequestName, Fields, ExpandableFields, TableFields> {
   constructor() {
      super(
         new TableConfig<Fields, ExpandableFields, TableFields>(
            'building', // tableName
            'id', // tablePrimaryKey
            {
               id: { name: 'id', convert: toTableId },
               name: { name: 'name', convert: toString },
               openingHours: {
                  cardinality: { name: 'oneToMany' },
                  tableConfig: openingHoursTable,
               },
            }, // domainFieldsToTableFieldsMap
         ),
      );
   }
   buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DomainRequestName]: DatabaseTable<DomainRequestName, Fields, ExpandableFields, TableFields>;
   }): DomainExpandableFieldsToTableFieldsMap<ExpandableFields, TableFields> {
      return {};
   }

   protected otherTableConfigToInit(select: SelectMethod): void {
      openingHoursTable.init(
         {
            building: {
               cardinality: { name: 'oneToOne', foreignKey: 'building_id' },
               tableConfig: this.getTableConfig(),
            },
         },
         select,
      );
   }
}

export const dbTable = new Database();
