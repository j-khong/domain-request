import { getFactory as getFactoryGeneric, Factory, Persistence } from '../../../mod.ts';
import { DomainRequestName, Role } from '../../types.ts';
import { DomainConfig, Fields } from '../types.ts';
import * as Admin from './roles/Admin.ts';
import * as Student from './roles/Student.ts';

export function getFactory(
   datastore: Persistence<DomainRequestName, Fields>,
): Factory<Role, DomainRequestName, Fields> {
   return getFactoryGeneric(
      {
         admin: new Admin.RequestBuilder(),
         student: new Student.RequestBuilder(),
      },
      datastore,
   );
}

export function createDomainConfig(role: Role): DomainConfig {
   switch (role) {
      case 'admin': {
         return Admin.createDomainConfig();
      }
      case 'student': {
         return Student.createDomainConfig();
      }
   }
}
