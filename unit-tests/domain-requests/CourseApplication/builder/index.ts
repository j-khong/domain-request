import { Factory, getFactoryForExpandables } from '../../../../src';
import { DomainRequestName, Role } from '../../types';
import { domainRequestName, expandableNames } from '../types';
import * as Admin from './roles/Admin';
import * as Student from './roles/Student';
import { dbTable } from './persistence/database';

export function getFactory(): Factory<Role, DomainRequestName> {
   return getFactoryForExpandables(
      {
         admin: new Admin.RequestBuilder(),
         student: new Student.RequestBuilder(),
      },
      dbTable,
      domainRequestName,
      expandableNames,
   );
}
