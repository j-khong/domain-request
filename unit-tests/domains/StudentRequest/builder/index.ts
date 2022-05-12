import { Builder as DomainBuilder, DomainRequestBuilder, initDomainRequest } from '../../../../src/DomainRequest';
import { DomainRequestName } from '../../types';
import { Role } from '../../User';
import { ExpandableFields } from '../expandables';
import { Fields } from '../fields';
import * as Admin from './roles/Admin';

// type Request = DomainRequest<Fields, ExpandableFields>;
type RequestBuilder = DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields>;
type Builder = DomainBuilder<Role, DomainRequestName, Fields, ExpandableFields, RequestBuilder>;

export function init(builders: {
   [Property in DomainRequestName]: Builder;
}): void {
   initDomainRequest(builders, 'student', ['country', 'courseApplication']);
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
