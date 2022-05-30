import { NestedRequestableFields, NestedFilteringFields } from '../../../../../../src';
import {
   DatabaseTableWithExtended,
   ExtendableTableConfig,
   ExtendedTableConfig,
   SelectMethod,
   toNumber,
   toString,
   toTableId,
} from '../../../../../../src/persistence/database';
import { DomainRequestName } from '../../../../types';
import { ExtendedFields, Fields, OpeningHours, Picture } from '../../../types';

type Key = 'id';
type TableFields = Key | 'name' | 'status';
class Database extends DatabaseTableWithExtended<DomainRequestName, Fields, TableFields> {
   constructor() {
      super(
         new ExtendableTableConfig<Fields, TableFields, ExtendedFields>(
            'buildings', // tableName
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
               pictures: {
                  cardinality: { name: 'oneToMany' },
                  tableConfig: picturesTable,
               },
            },
         ),
      );
   }

   protected extendedTableConfigToInit(select: SelectMethod): void {
      openingHoursTable.init(
         {
            building: {
               cardinality: { name: 'oneToOne', foreignKey: 'id_building' },
               tableConfig: this.getTableConfig(),
               dbt: this as any,
            },
         },
         select,
      );

      picturesTable.init(
         {
            building: {
               cardinality: { name: 'oneToOne', foreignKey: 'id_building' },
               tableConfig: this.getTableConfig(),
               dbt: this as any,
            },
         },
         select,
      );
   }
}

type TableFieldNames = 'id' | 'day' | 'start' | 'end' | 'id_building';

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

type PictureTableFieldNames = 'id' | 'url' | 'name' | 'description' | 'id_building';
const picturesTable = new ExtendedTableConfig<Picture, { building: {} }, PictureTableFieldNames>(
   'building_pictures',
   'id',
   {},
   (
      data: Array<{
         day?: number;
         start?: string;
         end?: string;
      }>,
   ): Array<NestedFilteringFields<Picture>> => {
      const ohs: any[] = [];
      return ohs;
   },
   (config: NestedRequestableFields<Picture>, thekey: PictureTableFieldNames): boolean => {
      return false;
   },
);

export const dbTable = new Database();
