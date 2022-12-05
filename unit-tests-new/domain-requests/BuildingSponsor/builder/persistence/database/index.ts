import { OneToOneTableMapping } from '../../../../../../src/index.ts';
import {
   TableDef,
   TableMapping,
   SameTableMapping,
   SelectMethod,
   Table,
   ToDbSqlNumberConverter,
   unknownToString,
} from '../../../../../mod.ts';
import { DomainRequestName } from '../../../../types.ts';
import { Fields } from '../../../types.ts';
import * as Building from '../../../../Building/builder/persistence/database/index.ts';
import * as Sponsor from '../../../../Sponsor/builder/persistence/database/index.ts';

const tableDef: TableDef = {
   name: 'building_sponsors',
   primaryKey: 'id',
};

const mapping: TableMapping<keyof Fields> = {
   id: new SameTableMapping(tableDef, 'id', new ToDbSqlNumberConverter(), unknownToString),
   building: new OneToOneTableMapping(
      Building.getTableDefinition(),
      Building.getTableMapping(),
      `${tableDef.name}.id_building`,
   ),
   sponsor: new OneToOneTableMapping(
      Sponsor.getTableDefinition(),
      Sponsor.getTableMapping(),
      `${tableDef.name}.id_sponsor`,
   ),
};

export function getTableDefinition(): TableDef {
   return tableDef;
}

export function getTableMapping(): TableMapping<keyof Fields> {
   return mapping;
}

export function buildTableConnector(select: SelectMethod): Table<DomainRequestName> {
   return new Table(tableDef, mapping, select);
}
