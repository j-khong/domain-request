import {
   buildDomainRequestFactory,
   Factory,
   Persistence,
   DomainConfig,
   createDomainRoleBuilder,
} from '../../../mod.ts';
import { DomainRequestName, getRoles, Role } from '../../types.ts';
import {
   Fields,
   domainRequestName,
   generateFieldsSetup,
   initDomainConfigWithDeps as initDomainConfig,
} from '../types.ts';

export function buildFactory(
   datastore: Persistence<DomainRequestName, Fields>,
): Factory<Role, DomainRequestName, Fields> {
   return buildDomainRequestFactory(mapping, datastore);
}

export function createDomainConfig(role: Role): DomainConfig<DomainRequestName, Fields> {
   return mapping[role].createDomainConfig();
}

const mapping = createDomainRoleBuilder(domainRequestName, generateFieldsSetup, getRoles())
   .withDependencyInitializer(initDomainConfig)
   .role('admin')
   .withAllFields()
   .and()
   .role('student')
   .withFields('id', 'firstname', 'lastname', 'yearOfBirth', 'country', 'category')
   .and()
   .build();
