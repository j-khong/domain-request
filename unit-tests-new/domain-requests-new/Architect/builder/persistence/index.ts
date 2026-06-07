import { SelectMethod, Persistence } from '../../../../mod.ts';
import { DomainRequestName } from '../../../types.ts';
import { Fields } from '../../types.ts';
import { buildTableConnector } from './database/index.ts';

export function buildConnector(select: SelectMethod): Persistence<DomainRequestName, Fields> {
   // we can return here another connector
   // which aggregates data from differents data source :
   // - SQL DB
   // - mem cache DB
   return buildTableConnector(select);
}
