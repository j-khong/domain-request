import * as Architect from './Architect/index.ts';
import * as ArchitectPersistence from './Architect/builder/persistence/database/index.ts';
import * as Sponsor from './Sponsor/index.ts';
import * as SponsorPersistence from './Sponsor/builder/persistence/database/index.ts';
import * as Country from './Country/index.ts';
import * as CountryPersistence from './Country/builder/persistence/database/index.ts';
import * as Course from './Course/index.ts';
import * as CoursePersistence from './Course/builder/persistence/database/index.ts';
import * as StudentCategory from './StudentCategory/index.ts';
import * as StudentCategoryPersistence from './StudentCategory/builder/persistence/database/index.ts';
// import * as Student from './Student/index.ts';
// import * as CourseApplication from './CourseApplication/index.ts';
import * as Building from './Building/index.ts';
import * as BuildingPersistence from './Building/builder/persistence/database/index.ts';
import * as BuildingCategory from './BuildingCategory/index.ts';
import * as BuildingCategoryPersistence from './BuildingCategory/builder/persistence/database/index.ts';
// import * as BuildingSponsor from './BuildingSponsor/index.ts';

import { DomainRequestName, Role } from './types.ts';
import { select } from '../persistence/database/dbUtils.ts';

import { DomainRequestHandler, initFactories, Factory } from '../mod.ts';
export function init(): void {
   initFactories(factories);
}

export function getDomainRequestHandler<DF>(
   name: DomainRequestName,
): DomainRequestHandler<Role, DomainRequestName, DF> {
   return factories[name] as DomainRequestHandler<Role, DomainRequestName, DF>;
}

type GenericType = Factory<Role, DomainRequestName, unknown>;
const factories: {
   [Property in DomainRequestName]: Factory<Role, DomainRequestName, unknown>;
} = {
   architect: Architect.buildFactory(ArchitectPersistence.buildTableConnector(select)) as GenericType,
   sponsor: Sponsor.buildFactory(SponsorPersistence.buildTableConnector(select)) as GenericType,
   country: Country.buildFactory(CountryPersistence.buildTableConnector(select)) as GenericType,
   course: Course.buildFactory(CoursePersistence.buildTableConnector(select)) as GenericType,
   studentCategory: StudentCategory.buildFactory(StudentCategoryPersistence.buildTableConnector(select)) as GenericType,
   building: Building.buildFactory(BuildingPersistence.buildTableConnector(select)) as GenericType,
   buildingCategory: BuildingCategory.buildFactory(
      BuildingCategoryPersistence.buildTableConnector(select),
   ) as GenericType,
   // student: Student.buildFactory(),
   // buildingSponsor: BuildingSponsor.buildFactory(),
   // courseApplication: CourseApplication.buildFactory(),
};
