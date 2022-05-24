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
openingHoursTable.setMapper(
   (
      data: Array<{
         day?: number;
         start?: string;
         end?: string;
      }>,
   ): {
      day?: number;
      slots?: Array<{ start?: string; end?: string }>;
   }[] => {
      const ohs: any[] = [];
      for (const d of data) {
         if (d.day === undefined) {
            continue;
         }
         let oh = ohs.find((o) => o.day === d.day);
         if (oh === undefined) {
            oh = {
               day: d.day,
            };
            ohs.push(oh);
         }
         if (d.start !== undefined || d.end != undefined) {
            if (oh.slots === undefined) {
               oh.slots = [];
            }
            const val: any = {};

            if (d.start !== undefined) val.start = d.start;
            if (d.end !== undefined) val.end = d.end;

            oh.slots.push(val);
         }
      }
      return ohs;
   },
);

openingHoursTable.setDecider(
   (
      config: {
         day: boolean;
         slots: { start: boolean; end: boolean };
      },
      thekey: 'day' | 'slots' | 'start' | 'end',
   ): boolean => {
      if (config[thekey as 'day'] !== undefined) {
         return config[thekey as 'day'];
      }

      if (config.slots[thekey as 'start' | 'end'] === undefined) {
         // throw new Error(`Decider problem: [${thekey}] is not in structure ${JSON.stringify(config, null, 2)}`);
         return false;
      }

      return config.slots[thekey as 'start' | 'end'];
   },
);

type Key = 'id';
type TableFields = Key | 'name' | 'status';
class Database extends DatabaseTable<DomainRequestName, Fields, ExpandableFields, TableFields> {
   constructor() {
      super(
         new TableConfig<Fields, ExpandableFields, TableFields>(
            'building', // tableName
            'id', // tablePrimaryKey
            {
               id: { name: 'id', convert: toTableId },
               name: { name: 'name', convert: toString },
               status: { name: 'status', convert: toString },
            }, // domainFieldsToTableFieldsMap
            {
               openingHours: {
                  cardinality: { name: 'oneToMany' },
                  tableConfig: openingHoursTable,
               },
            },
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
