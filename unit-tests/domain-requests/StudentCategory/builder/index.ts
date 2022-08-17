import { Factory, getFactoryForSimple } from '../../../mod.ts';
import { DomainRequestName, Role } from '../../types.ts';
import { admin } from './roles/Admin.ts';
import { student } from './roles/Student.ts';
import { dbTable } from './persistence/database/index.ts';

export function getFactory(): Factory<Role, DomainRequestName> {
   return getFactoryForSimple(
      {
         admin,
         student,
      },
      dbTable,
   );
}
