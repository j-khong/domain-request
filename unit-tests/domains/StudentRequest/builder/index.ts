import {
   DomainRequestBuilder,
   Builder as DomainBuilder,
   initAllRolesDomainRequestBuilders,
   Factory,
} from '../../../../src';
import { DomainRequestName, Role } from '../../types';
import { Fields, ExpandableFields } from '../types';
import * as Admin from './roles/Admin';
import * as DataFetch from './persistence/database';

type RequestBuilder = DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields>;
type Builder = DomainBuilder<Role, DomainRequestName, Fields, ExpandableFields, RequestBuilder>;

function init(builders: {
   [Property in DomainRequestName]: Builder;
}): void {
   initAllRolesDomainRequestBuilders(builders, 'student', ['country', 'courseApplication']);
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
