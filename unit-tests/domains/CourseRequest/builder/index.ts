import { Builder as DomainBuilder, DomainRequestBuilder, initDomainRequest } from '../../../../src/DomainRequest';
import { DomainRequestName, Role } from '../../types';

import * as Admin from './roles/Admin';
// import { RequestBuilder as RestrictedRequestBuilder } from './roles/Restricted';
import { Fields, ExpandableFields } from '../types';

//  type Request = DomainRequest<Fields, ExpandableFields>;
type RequestBuilder = DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields>;
type Builder = DomainBuilder<Role, DomainRequestName, Fields, ExpandableFields, RequestBuilder>;

export * as DataFetch from './persistence/database';

export function init(builders: {
   [Property in DomainRequestName]: Builder;
}): void {
   initDomainRequest(builders, 'course', []);
}

export function getRoleRequestBuilder(role: Role): RequestBuilder {
   return builder[role];
}

export function getAllRolesRequestBuilders(): Builder {
   return builder;
}

const builder: Builder = {
   admin: new Admin.RequestBuilder(),
   // restricted: (user: User) => new RestrictedRequestBuilder(user),
};
