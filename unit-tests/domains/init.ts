import * as Student from './StudentRequest';
import * as Country from './CountryRequest';
import * as CourseApplication from './CourseApplicationRequest';
import * as Course from './CourseRequest';
import { DomainRequestName, Role } from './types';
import { select } from '../persistence/database/dbUtils';
import { Factory, initFactories } from '../../src';

export function init(): void {
   initFactories(select, factories);
}

export function getDomainRequestFactory(name: DomainRequestName): Factory<Role, DomainRequestName> {
   return factories[name];
}

const factories: {
   [Property in DomainRequestName]: Factory<Role, DomainRequestName>;
} = {
   student: Student.getFactory(),
   country: Country.getFactory(),
   course: Course.getFactory(),
   courseApplication: CourseApplication.getFactory(),
};
