import {
   DomainRequestBuilder,
   Builder as DomainBuilder,
   initAllRolesDomainRequestBuilders,
   Factory,
   getFactory as getFactoryGeneric,
} from '../../../../src';
import { DomainRequestName, Role } from '../../types';
import * as Admin from './roles/Admin';
import { Fields, ExpandableFields } from '../types';
import { dbTable } from './persistence/database';

export function getFactory(): Factory<Role, DomainRequestName> {
   return getFactoryGeneric(builder, dbTable, init);
}

type RequestBuilder = DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields>;
type Builder = DomainBuilder<Role, DomainRequestName, Fields, ExpandableFields, RequestBuilder>;

function init(builders: {
   [Property in DomainRequestName]: Builder;
}): void {
   initAllRolesDomainRequestBuilders(builders, 'courseApplication', ['course', 'student']);
}

const builder: Builder = {
   admin: new Admin.RequestBuilder(),
   // restricted: (user: User) => new RestrictedRequestBuilder(user),
};
