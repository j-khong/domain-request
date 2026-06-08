import { Persistence, SelectMethod } from '/deps/index.ts';
import { DomainRequestName } from '@domains/types.ts';
import { Fields } from '../../types.ts';
import { buildTableConnector } from './database/index.ts';

export function buildConnector(select: SelectMethod): Persistence<DomainRequestName, Fields> {
   // we can return here another connector
   // which aggregates data from differents data source :
   // - SQL DB
   // - mem cache DB
   // - etc...
   return buildTableConnector(select);
}
