import { Factory, getFactory as getFactoryGeneric } from '../../../../src';
import { DomainRequestName, Role } from '../../types';
import { domainRequestName, expandableNames } from '../types';
import * as Admin from './roles/Admin';
import { dbTable } from './persistence/database';

export function getFactory(): Factory<Role, DomainRequestName> {
   return getFactoryGeneric(
      {
         admin: new Admin.RequestBuilder(),
      },
      dbTable,
      domainRequestName,
      expandableNames,
   );
}
