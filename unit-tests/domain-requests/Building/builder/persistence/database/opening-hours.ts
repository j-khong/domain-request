import {
   NestedRequestableFields,
   NestedFilteringFields,
   buildSameTableMapping,
   ExtendedTableConfig,
   ToDbSqlNumberConverter,
   ToDbSqlStringConverter,
} from '../../../../../mod.ts';

import { OpeningHours } from '../../../types.ts';

interface Table {
   id: number;
   day: number;
   start: string;
   end: string;
}

export const openingHoursTable = new ExtendedTableConfig<OpeningHours, keyof Table>(
   'building_opening_hours', // tableName
   'id', // tablePrimaryKey
   {
      id: buildSameTableMapping('id', new ToDbSqlNumberConverter(), (o: unknown) => (o as any).toString()),
      day: buildSameTableMapping('day', new ToDbSqlNumberConverter()),
      start: buildSameTableMapping('start', new ToDbSqlStringConverter()),
      end: buildSameTableMapping('end', new ToDbSqlStringConverter()),
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
   (config: NestedRequestableFields<OpeningHours>, thekey: keyof Table): boolean => {
      if (config[thekey as 'day'] !== undefined) {
         return config[thekey as 'day'];
      }

      if (config.slots[thekey as 'start' | 'end'] === undefined) {
         return false;
      }

      return config.slots[thekey as 'start' | 'end'];
   },
);
