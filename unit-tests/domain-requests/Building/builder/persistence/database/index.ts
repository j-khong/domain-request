import { NestedRequestableFields, NestedFilteringFields } from '../../../../../../src';
import {
   buildExpandablesToTableMapping,
   buildSameTableMapping,
   DatabaseTableWithExtendedAndExpandables,
   DomainExpandableFieldsToTableFieldsMap,
   ExtendableAndExpandablesTableConfig,
   ExtendedTableConfig,
   Level2ExtendedTableConfig,
   SelectMethod,
   SimpleDatabaseTable,
   toNumber,
   toString,
   toTableId,
} from '../../../../../../src/persistence/database';
import { DomainRequestName } from '../../../../types';
import { ExtendedFields, ExpandableFields, Fields, OpeningHours, Picture } from '../../../types';

type Key = 'id';
type TableFields = Key | 'name' | 'status';
class Database extends DatabaseTableWithExtendedAndExpandables<
   DomainRequestName,
   Fields,
   ExtendedFields,
   ExpandableFields,
   TableFields
> {
   constructor() {
      super(
         new ExtendableAndExpandablesTableConfig<Fields, ExtendedFields, ExpandableFields, TableFields>(
            'buildings', // tableName
            'id', // tablePrimaryKey
            {
               id: buildSameTableMapping('id', toTableId, (o) => o.toString()),
               name: buildSameTableMapping('name', toString),
               status: buildSameTableMapping('status', toString),
               privateField: buildSameTableMapping('status', toString),
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

   buildDomainExpandableFieldsToTableFieldsMap(allDbTables: {
      [Property in DomainRequestName]: SimpleDatabaseTable<DomainRequestName, Fields, TableFields>;
   }): DomainExpandableFieldsToTableFieldsMap<ExpandableFields, any> {
      return {
         sponsors: buildExpandablesToTableMapping({
            globalContextDomainName: 'buildingSponsor',
            localContextDomainName: 'sponsors',
            cardinality: { name: 'oneToMany' },
            allDbTables,
         }),
      };
   }

   protected extendedTableConfigToInit(select: SelectMethod): void {
      openingHoursTable.init(select, {
         cardinality: { name: 'oneToOne', foreignKey: 'id_building' },
         tableConfig: this.getTableConfig(),
      });

      picturesTable.init(select, {
         cardinality: { name: 'oneToOne', foreignKey: 'id_building' },
         tableConfig: this.getTableConfig(),
      });
   }
}

type TableFieldNames = 'id' | 'day' | 'start' | 'end' | 'id_building';

const openingHoursTable = new ExtendedTableConfig<OpeningHours, TableFieldNames>(
   'building_opening_hours', // tableName
   'id', // tablePrimaryKey
   {
      id: buildSameTableMapping('id', toTableId, (o) => o.toString()),
      day: buildSameTableMapping('day', toNumber),
      start: buildSameTableMapping('start', toString),
      end: buildSameTableMapping('end', toString),
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

type PictureTableFieldNames = 'id' | 'url' | 'name' | 'description' | 'status' | 'id_building';

const picturesTable = new Level2ExtendedTableConfig<Picture, PictureTableFieldNames>(
   { tableName: 'building_pictures', tablePrimaryKey: 'id', tableForeignKeyToLevel2: 'id_picture' },
   { tableName: 'pictures', tablePrimaryKey: 'id' },
   new Map<string, PictureTableFieldNames[]>([
      ['pictures', ['id', 'url', 'name', 'description']],
      ['building_pictures', ['status']],
   ]),
   {
      url: buildSameTableMapping('url', toString),
      name: buildSameTableMapping('name', toString),
      description: buildSameTableMapping('description', toString),
      status: buildSameTableMapping('status', toString),
   },
   (
      data: Array<{
         name?: string;
         url?: string;
         description?: string;
         status?: string;
      }>,
   ): Array<NestedFilteringFields<Picture>> => {
      const ret: any[] = [];
      for (const d of data) {
         const res: any = {};
         if (d.name !== undefined) {
            res.name = d.name;
         }
         if (d.url !== undefined) {
            res.url = d.url;
         }
         if (d.description !== undefined) {
            res.description = d.description;
         }
         if (d.status !== undefined) {
            res.status = d.status;
         }
         ret.push(res);
      }
      return ret;
   },
   (config: NestedRequestableFields<Picture>, thekey: PictureTableFieldNames): boolean => {
      if (config[thekey as 'url' | 'name' | 'description'] === undefined) {
         return false;
      }

      return config[thekey as 'url' | 'name' | 'description'];
   },
);

export const dbTable = new Database();
