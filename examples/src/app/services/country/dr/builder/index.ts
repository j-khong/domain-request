import { buildDomainRequestFactory, createDomainRoleBuilder, DomainConfig, Factory, Persistence } from '/deps/index.ts';
import { DomainRequestName, getRoles, Role } from '@domains/types.ts';
import { domainRequestName, Fields, generateFieldsSetup } from '../types.ts';

export function buildFactory(
   datastore: Persistence<DomainRequestName, Fields>,
): Factory<Role, DomainRequestName, Fields> {
   return buildDomainRequestFactory(mapping, datastore);
}

export function createDomainConfig(role: Role): DomainConfig<DomainRequestName, Fields> {
   return mapping[role].createDomainConfig();
}

const mapping = createDomainRoleBuilder(domainRequestName, generateFieldsSetup, getRoles())
   .role('admin')
   .withAllFields()
   .and()
   .role('student')
   .withAllFields()
   .and()
   .build();
