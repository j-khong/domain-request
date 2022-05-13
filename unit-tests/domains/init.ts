import * as Student from './StudentRequest';
import * as Country from './CountryRequest';
import * as CourseApplication from './CourseApplicationRequest';
import * as Course from './CourseRequest';
import {
   Builder as DomainBuilder,
   DomainExpandables,
   DomainFields,
   DomainRequestBuilder,
} from '../../src/DomainRequest';
import { Role } from './User';
import { DomainRequestName } from './types';

type RequestBuilder<Fields extends DomainFields, Expandables extends DomainExpandables> = DomainRequestBuilder<
   DomainRequestName,
   Fields,
   Expandables
>;
type Builder<Fields extends DomainFields, Expandables extends DomainExpandables> = DomainBuilder<
   Role,
   DomainRequestName,
   Fields,
   Expandables,
   RequestBuilder<Fields, Expandables>
>;

const builders: {
   [Property in DomainRequestName]: Builder<any, any>;
} = {
   student: Student.getAllRolesRequestBuilders(),
   country: Country.getAllRolesRequestBuilders(),
   courseApplication: CourseApplication.getAllRolesRequestBuilders(),
   course: Course.getAllRolesRequestBuilders(),
};

const inits: {
   [Property in DomainRequestName]: (allbuilders: {
      [Property in DomainRequestName]: Builder<any, any>;
   }) => void;
} = {
   student: Student.init,
   country: Country.init,
   courseApplication: CourseApplication.init,
   course: Course.init,
};

export function init() {
   for (const requestNameKey in inits) {
      const init = inits[requestNameKey as DomainRequestName];
      init(builders);
   }
}

export function getBuilders(): {
   [Property in DomainRequestName]: Builder<any, any>;
} {
   return builders;
}
