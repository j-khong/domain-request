import { Persistence, SelectMethod } from '@jkhong/domain-request';
import { DomainRequestName } from '@domains/types';
import { Fields } from '../../types';
import { buildTableConnector } from './database';

export function buildConnector(select: SelectMethod): Persistence<DomainRequestName, Fields> {
   // we can return here another connector
   // which aggregates data from differents data source :
   // - SQL DB
   // - mem cache DB
   // - etc...
   return buildTableConnector(select);
}
