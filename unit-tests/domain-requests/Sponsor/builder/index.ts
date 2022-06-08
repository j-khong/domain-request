import { Factory, getFactoryForSimple } from '../../../../src';
import { DomainRequestName, Role } from '../../types';
import * as Admin from './roles/Admin';
import * as Student from './roles/Student';
import { dbTable } from './persistence/database';

export function getFactory(): Factory<Role, DomainRequestName> {
   return getFactoryForSimple(
      {
         admin: new Admin.RequestBuilder(),
         student: new Student.RequestBuilder(),
      },
      dbTable,
   );
}
