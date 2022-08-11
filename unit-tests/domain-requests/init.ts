import * as Sponsor from './Sponsor/index.ts';
import * as Country from './Country/index.ts';
import * as Course from './Course/index.ts';
import * as StudentCategory from './StudentCategory/index.ts';
// import * as Student from './Student/index.ts';
// import * as CourseApplication from './CourseApplication/index.ts';
// import * as Building from './Building/index.ts';
// import * as BuildingSponsor from './BuildingSponsor/index.ts';

import { DomainRequestName, Role } from './types.ts';
import { select } from '../persistence/database/dbUtils.ts';
import { DomainRequestHandler, Factory, initFactories } from '../../src/index.ts';

export function init(): void {
   initFactories(select, factories);
}

export function getDomainRequestHandler<DF>(
   name: DomainRequestName,
): DomainRequestHandler<Role, DomainRequestName, DF> {
   return factories[name];
}

const factories: {
   [Property in DomainRequestName]: Factory<Role, DomainRequestName>;
} = {
   sponsor: Sponsor.getFactory(),
   country: Country.getFactory(),
   course: Course.getFactory(),
   studentCategory: StudentCategory.getFactory(),
   // building: Building.getFactory(),
   // buildingSponsor: BuildingSponsor.getFactory(),
   // student: Student.getFactory(),
   // courseApplication: CourseApplication.getFactory(),
};
