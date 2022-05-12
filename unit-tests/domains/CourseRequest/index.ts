import { DomainRequestName } from '..';
import { Builder as DomainBuilder, DomainRequestBuilder, initDomainRequest } from '../../../src/DomainRequest';
import { Role } from '../User';
import * as Admin from './roles/Admin';
// import { RequestBuilder as RestrictedRequestBuilder } from './roles/Restricted';
import { RequestBuilder, Fields, ExpandableFields } from './types';

export { Request, RequestBuilder, Fields, ExpandableFields } from './types';

export function getRoleRequestBuilder(role: Role): RequestBuilder {
   return builder2[role];
}

type Builder = DomainBuilder<Role, DomainRequestName, Fields, ExpandableFields, RequestBuilder>;

const builder2: Builder = {
   admin: new Admin.RequestBuilder({} as any),
   // restricted: (user: User) => new RestrictedRequestBuilder(user),
};

export function getRequestBuilder(): Builder {
   return builder2;
}

export function init(builders: {
   [Property in DomainRequestName]: Builder;
}): void {
   initDomainRequest(builders, 'course', []);
}
