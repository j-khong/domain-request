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
import { DomainRequestName, Role } from './types';
import { Result } from './CountryRequest';
import { SelectMethod } from '../../src/persistence/database';
import { select } from '../persistence/database/dbUtils';

export function init(): void {
   for (const requestNameKey in inits) {
      const init = inits[requestNameKey as DomainRequestName];
      init.initBuilder(builders);
      init.initDataFetcher(select);
   }
}

export function getBuildersAndFetchers(): {
   [Property in DomainRequestName]: {
      builder: Builder<any, any>;
      dataFetcher: {
         fetch: (req: DomainRequest<any, any>) => Result;
      };
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
   [Property in DomainRequestName]: {
      fetch: (req: DomainRequest<any, any>) => Result;
   };
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
   [Property in DomainRequestName]: {
      initBuilder: (allbuilders: {
         [Property in DomainRequestName]: Builder<any, any>;
      }) => void;
      initDataFetcher: (select: SelectMethod) => void;
   };
} = {
   student: { initBuilder: Student.init, initDataFetcher: Student.DataFetch.init },
   country: { initBuilder: Country.init, initDataFetcher: Country.DataFetch.init },
   courseApplication: { initBuilder: CourseApplication.init, initDataFetcher: CourseApplication.DataFetch.init },
   course: { initBuilder: Course.init, initDataFetcher: Course.DataFetch.init },
};

const dataFetchers: {
   [Property in DomainRequestName]: {
      fetch: (req: DomainRequest<any, any>) => Result;
   };
} = {
   student: { fetch: Student.DataFetch.fetch },
   course: { fetch: Course.DataFetch.fetch },
   courseApplication: { fetch: CourseApplication.DataFetch.fetch },
   country: { fetch: Country.DataFetch.fetch },
};

const all: {
   [Property in DomainRequestName]: {
      builder: Builder<any, any>;
      dataFetcher: {
         fetch: (req: DomainRequest<any, any>) => Result;
      };
   };
} = {
   student: {
      builder: builders.student,
      dataFetcher: dataFetchers.student,
   },
   country: {
      builder: builders.country,
      dataFetcher: dataFetchers.country,
   },
   course: {
      builder: builders.course,
      dataFetcher: dataFetchers.course,
   },
   courseApplication: {
      builder: builders.courseApplication,
      dataFetcher: dataFetchers.courseApplication,
   },
};
