import * as Student from './Student';
import * as Country from './Country';
import * as CourseApplication from './CourseApplication';
import * as Course from './Course';
import * as StudentCategory from './StudentCategory';
import * as Building from './Building';

import { DomainRequestName, Role } from './types';
import { select } from '../persistence/database/dbUtils';
import { DomainRequestHandler, Factory, initFactories } from '../../src';

export function init(): void {
   initFactories(select, factories);
}

export function getDomainRequestHandler(name: DomainRequestName): DomainRequestHandler<Role, DomainRequestName> {
   return factories[name];
}

const factories: {
   [Property in DomainRequestName]: Factory<Role, DomainRequestName>;
} = {
   country: Country.getFactory(),
   course: Course.getFactory(),
   studentCategory: StudentCategory.getFactory(),
   building: Building.getFactory(),
   student: Student.getFactory(),
   courseApplication: CourseApplication.getFactory(),
};
