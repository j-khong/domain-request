import * as Student from './StudentRequest';
import * as Country from './CountryRequest';
import * as CourseApplication from './CourseApplicationRequest';
import * as Course from './CourseRequest';
import {
   Builder as DomainBuilder,
   DomainExpandables,
   DomainFields,
   DomainRequestBuilder,
   DomainRequest,
} from '../../src/DomainRequest';
import { Role } from './User';
import { DomainRequestName } from './types';
import { Result } from './CountryRequest';

export function init(): void {
   for (const requestNameKey in inits) {
      const init = inits[requestNameKey as DomainRequestName];
      init(builders);
   }
}

export function getBuildersAndFetchers(): {
   [Property in DomainRequestName]: {
      builder: Builder<any, any>;
      fetch: (req: DomainRequest<any, any>) => Result;
   };
} {
   return all;
}

export function getBuilders(): {
   [Property in DomainRequestName]: Builder<any, any>;
} {
   return builders;
}

export function getDataFetchers(): {
   [Property in DomainRequestName]: (req: DomainRequest<any, any>) => Result;
} {
   return dataFetchers;
}

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

const dataFetchers: {
   [Property in DomainRequestName]: (req: DomainRequest<any, any>) => Result;
} = {
   student: <Fields extends DomainFields, Expandables extends DomainExpandables>(
      req: DomainRequest<Fields, Expandables>,
   ): Result => {
      return {};
   },
   course: <Fields extends DomainFields, Expandables extends DomainExpandables>(
      req: DomainRequest<Fields, Expandables>,
   ): Result => {
      return {};
   },
   courseApplication: <Fields extends DomainFields, Expandables extends DomainExpandables>(
      req: DomainRequest<Fields, Expandables>,
   ): Result => {
      return {};
   },
   country: Country.fetch,
};

const all: {
   [Property in DomainRequestName]: {
      builder: Builder<any, any>;
      fetch: (req: DomainRequest<any, any>) => Result;
   };
} = {
   student: {
      builder: builders.student,
      fetch: dataFetchers.student,
   },
   country: {
      builder: builders.country,
      fetch: dataFetchers.country,
   },
   course: {
      builder: builders.course,
      fetch: dataFetchers.course,
   },
   courseApplication: {
      builder: builders.courseApplication,
      fetch: dataFetchers.courseApplication,
   },
};
