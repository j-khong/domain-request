import {
   NestedRequestableFields,
   NestedFilteringFields,
   buildSameTableMapping,
   Level2ExtendedTableConfig,
   ToDbSqlStringConverter,
} from '../../../../../mod.ts';

import { Picture } from '../../../types.ts';

interface Table {
   id: number;
   url: string;
   name: string;
   description: string;
   status: string;
   id_building: number;
}

export const picturesTable = new Level2ExtendedTableConfig<Picture, keyof Table>(
   { tableName: 'building_pictures', tablePrimaryKey: 'id', tableForeignKeyToLevel2: 'id_picture' },
   { tableName: 'pictures', tablePrimaryKey: 'id' },
   new Map<string, (keyof Table)[]>([
      ['pictures', ['id', 'url', 'name', 'description']],
      ['building_pictures', ['status']],
   ]),
   {
      url: buildSameTableMapping('url', new ToDbSqlStringConverter()),
      name: buildSameTableMapping('name', new ToDbSqlStringConverter()),
      description: buildSameTableMapping('description', new ToDbSqlStringConverter()),
      status: buildSameTableMapping('status', new ToDbSqlStringConverter()),
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
   (config: NestedRequestableFields<Picture>, thekey: keyof Table): boolean => {
      if (config[thekey as 'url' | 'name' | 'description'] === undefined) {
         return false;
      }

      return config[thekey as 'url' | 'name' | 'description'];
   },
);
