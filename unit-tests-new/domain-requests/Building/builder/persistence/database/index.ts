import {
   TableDef,
   TableMapping,
   SameTableMapping,
   OneToOneTableMapping,
   OneToManyTableMapping,
   SelectMethod,
   Table,
   ToDbSqlNumberConverter,
   ToDbSqlStringConverter,
   unknownToString,
   unknownToNumber,
   ValueMapper,
   OneToManyTableDef,
   OneToOneFieldMapping,
} from '../../../../../mod.ts';
import { DomainRequestName } from '../../../../types.ts';
import { Fields, Status, OpeningHours, Picture, Sponsor } from '../../../types.ts';
import * as BuildingCategory from '../../../../BuildingCategory/builder/persistence/database/index.ts';
import * as Sponsoro from '../../../../Sponsor/builder/persistence/database/index.ts';
import * as Architect from '../../../../Architect/builder/persistence/database/index.ts';

// const openingHoursTable: OneToManyTableDef = {
//    name: 'building_opening_hours',
//    primaryKey: 'id',
//    foreignKey: 'id_building',
// };
// const openingHoursMapping: TableMapping<OpeningHours> = {
//    id: new SameTableMapping(openingHoursTable, 'id', new ToDbSqlNumberConverter(), unknownToString),
//    day: new SameTableMapping(openingHoursTable, 'day', new ToDbSqlNumberConverter(), unknownToNumber),
//    slots: new ObjectFieldConfiguration()
// };

const buildingTable: TableDef = {
   name: 'buildings',
   primaryKey: 'id',
};

const picturesTable: TableDef = {
   name: 'pictures',
   primaryKey: 'id',
};

const buildingSponsorsTable: OneToManyTableDef = {
   name: 'building_sponsors',
   primaryKey: 'id',
   foreign: { keyName: 'id_building', otherTable: buildingTable },
};

const buildingSponsorsMapping: TableMapping<keyof Sponsor> = {
   contribution: new SameTableMapping(
      buildingSponsorsTable,
      'contribution',
      new ToDbSqlNumberConverter(),
      unknownToNumber,
   ),
   id: new OneToOneFieldMapping(
      Sponsoro.getTableDefinition(),
      'id',
      new ToDbSqlNumberConverter(),
      unknownToString,
      buildingSponsorsTable.name,
      'id_sponsor',
   ),
   name: new OneToOneFieldMapping(
      Sponsoro.getTableDefinition(),
      'name',
      new ToDbSqlStringConverter(),
      unknownToString,
      buildingSponsorsTable.name,
      'id_sponsor',
   ),
};

const buildingPicturesTable: OneToManyTableDef = {
   name: 'building_pictures',
   primaryKey: 'id',
   foreign: { keyName: 'id_building', otherTable: buildingTable },
};

const buildingPicturesMapping: TableMapping<keyof Picture> = {
   status: new SameTableMapping(buildingPicturesTable, 'status', new ToDbSqlStringConverter(), unknownToString),
   url: new OneToOneFieldMapping(
      picturesTable,
      'url',
      new ToDbSqlStringConverter(),
      unknownToString,
      buildingPicturesTable.name,
      'id_picture',
   ),
   name: new OneToOneFieldMapping(
      picturesTable,
      'name',
      new ToDbSqlStringConverter(),
      unknownToString,
      buildingPicturesTable.name,
      'id_picture',
   ),
   description: new OneToOneFieldMapping(
      picturesTable,
      'description',
      new ToDbSqlStringConverter(),
      unknownToString,
      buildingPicturesTable.name,
      'id_picture',
   ),
};

// type BuildingDomainFieldNames = Fields;
type BuildingDomainFieldNames =
   | 'id'
   | 'name'
   | 'type'
   | 'status'
   | 'pictures'
   | 'sponsors' /*| 'openingHours' */
   | 'architect'
   | 'privateField';

class ToDbSqlStatusConverter extends ToDbSqlStringConverter {
   constructor() {
      super(toDbStatus);
   }
}

const buildingMapping: TableMapping<BuildingDomainFieldNames> = {
   id: new SameTableMapping(buildingTable, 'id', new ToDbSqlNumberConverter(), unknownToString),
   name: new SameTableMapping(buildingTable, 'name', new ToDbSqlStringConverter(), unknownToString),
   type: new OneToOneTableMapping(
      BuildingCategory.getTableDefinition(),
      BuildingCategory.getTableMapping(),
      `${buildingTable.name}.id_category`,
   ),
   architect: new OneToOneTableMapping(
      Architect.getTableDefinition(),
      Architect.getTableMapping(),
      `${buildingTable.name}.id_architect`,
   ),
   privateField: new SameTableMapping(buildingTable, 'confidential', new ToDbSqlStringConverter(), unknownToString),
   status: new SameTableMapping(buildingTable, 'status', new ToDbSqlStatusConverter(), toDomainStatus),
   sponsors: new OneToManyTableMapping(buildingSponsorsTable, buildingSponsorsMapping),

   // openingHours: new OneToManyTableMapping(openingHoursTable, openingHoursMapping),
   pictures: new OneToManyTableMapping(buildingPicturesTable, buildingPicturesMapping),
};

type DbStatus = 'o' | 'wip' | 'c';
const dbToDomain = new Map<DbStatus, Status>([
   ['o', 'opened'],
   ['wip', 'work in progress'],
   ['c', 'closed'],
]);
const statusValueMapper = new ValueMapper<DbStatus, Status>(dbToDomain);

function toDbStatus(o: unknown): string {
   return statusValueMapper.toDbValue(o as Status, '' as DbStatus);
}

function toDomainStatus(o: unknown): Status {
   return statusValueMapper.toDomainValue(o as DbStatus, 'closed');
}

export function buildTableConnector(select: SelectMethod): Table<DomainRequestName> {
   // buildingMapping.openingHours.init(new Table(openingHoursTable, openingHoursMapping, select));
   return new Table(buildingTable, buildingMapping, select);
}