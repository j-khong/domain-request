import {
   Builder as DomainBuilder,
   DomainRequest,
   DomainRequestBuilder,
   initDomainRequest,
} from '../../../../src/DomainRequest';
import { Role, User } from '../../User';
import * as Admin from './roles/Admin';
import { Fields } from '../fields';
import { ExpandableFields } from '../expandables';
import { DomainRequestName } from '../..';

export type Request = DomainRequest<Fields, ExpandableFields>;
export type RequestBuilder = DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields>;

export function getRoleRequestBuilder(role: Role): RequestBuilder {
   return builder2[role];
}

type Builder = DomainBuilder<Role, DomainRequestName, Fields, ExpandableFields, RequestBuilder>;

const builder2: Builder = {
   admin: new Admin.RequestBuilder(),
   // restricted: (user: User) => new RestrictedRequestBuilder(user),
};

export function getRequestBuilder(): Builder {
   return builder2;
}

export function init(builders: {
   [Property in DomainRequestName]: Builder;
}): void {
   initDomainRequest(builders, 'courseApplication', ['course', 'student']);
}
