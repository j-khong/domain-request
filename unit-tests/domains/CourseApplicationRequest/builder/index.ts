import {
   DomainRequestBuilder,
   Builder as DomainBuilder,
   initAllRolesDomainRequestBuilders,
   Factory,
} from '../../../../src';
import { DomainRequestName, Role } from '../../types';
import * as Admin from './roles/Admin';
import { Fields, ExpandableFields } from '../types';

type RequestBuilder = DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields>;
type Builder = DomainBuilder<Role, DomainRequestName, Fields, ExpandableFields, RequestBuilder>;

import * as DataFetch from './persistence/database';

function init(builders: {
   [Property in DomainRequestName]: Builder;
}): void {
   initAllRolesDomainRequestBuilders(builders, 'courseApplication', ['course', 'student']);
}

export function getAllRolesRequestBuilders(): Builder {
   return builder;
}

const builder: Builder = {
   admin: new Admin.RequestBuilder(),
   // restricted: (user: User) => new RestrictedRequestBuilder(user),
};

export function getFactory(): Factory<Role, DomainRequestName> {
   return {
      getAllRolesRequestBuilders: getAllRolesRequestBuilders,
      getRoleDomainRequestBuilder: (role: Role) => getAllRolesRequestBuilders()[role],
      fetchData: (req) => DataFetch.dbTable.fetch(req),
      initRolesBuilders: init,
      dbTable: DataFetch.dbTable,
   };
}
