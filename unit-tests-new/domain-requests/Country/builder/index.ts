import { buildDomainRequestFactory, Factory, DomainRequestByRole, Persistence, DomainConfig } from '../../../mod.ts';
import { DomainRequestName, Role } from '../../types.ts';
import { Fields } from '../types.ts';
import * as Admin from './roles/Admin.ts';
import * as Student from './roles/Student.ts';

export function buildFactory(
   datastore: Persistence<DomainRequestName, Fields>,
): Factory<Role, DomainRequestName, Fields> {
   return buildDomainRequestFactory(mapping, datastore);
}

export function createDomainConfig(role: Role): DomainConfig<DomainRequestName, Fields> {
   return mapping[role].createDomainConfig();
}

const mapping: DomainRequestByRole<Role, DomainRequestName, Fields> = {
   admin: Admin,
   student: Student,
};
