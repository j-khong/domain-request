import { Factory, getFactoryForExtended } from '../../../../src';
import { DomainRequestName, Role } from '../../types';
import { domainRequestName } from '../types';
import * as Admin from './roles/Admin';
import * as Student from './roles/Student';
import { dbTable } from './persistence/database';

export function getFactory(): Factory<Role, DomainRequestName> {
   return getFactoryForExtended(
      {
         admin: new Admin.RequestBuilder(),
         student: new Student.RequestBuilder(),
      },
      dbTable,
   );
}
