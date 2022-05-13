import { Builder as DomainBuilder, DomainRequestBuilder, initDomainRequest } from '../../../../src/DomainRequest';
import { DomainRequestName } from '../../types';
import { Role } from '../../User';
import * as Admin from './roles/Admin';
// import { RequestBuilder as RestrictedRequestBuilder } from './roles/Restricted';
import { Fields, ExpandableFields } from '../types';

export * from './persistence/database';

type RequestBuilder = DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields>;
type Builder = DomainBuilder<Role, DomainRequestName, Fields, ExpandableFields, RequestBuilder>;

export function init(builders: {
   [Property in DomainRequestName]: Builder;
}): void {
   initDomainRequest(builders, 'country', []);
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
