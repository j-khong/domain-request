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
import * as BuildingSponsor from './BuildingSponsor/index.ts';
import * as BuildingSponsorPersistence from './BuildingSponsor/builder/persistence/database/index.ts';

import { DomainRequestName, Role } from './types.ts';
import { DomainRequestHandler, Factory, SelectMethodResult } from '../mod.ts';

export function init(select: (query: string) => Promise<SelectMethodResult>): void {
   createFactories(select);
}

export function getDomainRequestHandler<DF>(
   name: DomainRequestName,
): DomainRequestHandler<Role, DomainRequestName, DF> {
   return getFactories()[name] as DomainRequestHandler<Role, DomainRequestName, DF>;
}

type GenericType = Factory<Role, DomainRequestName, unknown>;
function createFactories(select: (query: string) => Promise<SelectMethodResult>): void {
   factories = {
      architect: Architect.buildFactory(ArchitectPersistence.buildTableConnector(select)) as GenericType,
      sponsor: Sponsor.buildFactory(SponsorPersistence.buildTableConnector(select)) as GenericType,
      country: Country.buildFactory(CountryPersistence.buildTableConnector(select)) as GenericType,
      course: Course.buildFactory(CoursePersistence.buildTableConnector(select)) as GenericType,
      studentCategory: StudentCategory.buildFactory(
         StudentCategoryPersistence.buildTableConnector(select),
      ) as GenericType,
      building: Building.buildFactory(BuildingPersistence.buildTableConnector(select)) as GenericType,
      buildingCategory: BuildingCategory.buildFactory(
         BuildingCategoryPersistence.buildTableConnector(select),
      ) as GenericType,
      // student: Student.buildFactory(),
      buildingSponsor: BuildingSponsor.buildFactory(
         BuildingSponsorPersistence.buildTableConnector(select),
      ) as GenericType,
      // courseApplication: CourseApplication.buildFactory(),
   };
}
type Factories = {
   [Property in DomainRequestName]: Factory<Role, DomainRequestName, unknown>;
};
function getFactories(): Factories {
   if (factories === undefined) throw new Error('please init domains requests ');
   return factories;
}

let factories: Factories | undefined;
