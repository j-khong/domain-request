import { NestedRequestableFields, NestedFilteringFields } from '../../../../../../src';
import {
   DatabaseTable,
   ExtendableTableConfig,
   ExtendedTableConfig,
   SelectMethod,
   toNumber,
   toString,
   toTableId,
} from '../../../../../../src/persistence/database';
import { DomainRequestName } from '../../../../types';
import { ExpandableFields, ExtendedFields, Fields, OpeningHours } from '../../../types';

type Key = 'id';
type TableFields = Key | 'name' | 'status';
class Database extends DatabaseTable<DomainRequestName, Fields, ExpandableFields, TableFields> {
   constructor() {
      super(
         new ExtendableTableConfig<Fields, ExpandableFields, TableFields, ExtendedFields>(
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

type TableFieldNames = 'id' | 'day' | 'start' | 'end' | 'building_id';

const openingHoursTable = new ExtendedTableConfig<OpeningHours, { building: {} }, TableFieldNames>(
   'building_opening_hours', // tableName
   'id', // tablePrimaryKey
   {
      day: { name: 'day', convert: toNumber },
      start: { name: 'start', convert: toString },
      end: { name: 'end', convert: toString },
   }, // domainFieldsToTableFieldsMap
   (
      data: Array<{
         day?: number;
         start?: string;
         end?: string;
      }>,
   ): Array<NestedFilteringFields<OpeningHours>> => {
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
   (config: NestedRequestableFields<OpeningHours>, thekey: TableFieldNames): boolean => {
      if (config[thekey as 'day'] !== undefined) {
         return config[thekey as 'day'];
      }

      if (config.slots[thekey as 'start' | 'end'] === undefined) {
         return false;
      }

      return config.slots[thekey as 'start' | 'end'];
   },
);
