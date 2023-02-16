import {
   buildDomainRequestFactory,
   Factory,
   DomainRequestByRole,
   Persistence,
   DomainConfig,
   buildDomainRequestBuilderByRole,
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

const mapping: DomainRequestByRole<Role, DomainRequestName, Fields> = buildDomainRequestBuilderByRole({
   domainRequestName,
   generateFieldsSetup,
   rolesList: getRoles(),
   initDomainConfig,
   rolesSpecifics: {
      admin: {},
      student: {
         modifyFieldsSetup: (setup) => {
            setup.status.addAuthorized(['opened', 'work in progress']);
         },
         authorizedFields: ['id', 'name', 'status', 'pictures', 'sponsors', 'architect'],
      },
   },
});
