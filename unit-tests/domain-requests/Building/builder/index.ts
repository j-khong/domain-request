import { Factory, getFactoryForExtendedAndExpandables } from '../../../mod.ts';
import { DomainRequestName, Role } from '../../types.ts';
import { domainRequestName, expandableNames } from '../types.ts';
import * as Admin from './roles/Admin.ts';
import * as Student from './roles/Student.ts';
import { dbTable } from './persistence/database/index.ts';

export function getFactory(): Factory<Role, DomainRequestName> {
   return getFactoryForExtendedAndExpandables(
      {
         admin: new Admin.RequestBuilder(),
         student: new Student.RequestBuilder(),
      },
      dbTable,
      domainRequestName,
      expandableNames,
   );
}
