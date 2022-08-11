import { FilteringConfig } from '../../mod.ts';
import { DomainRequestName } from '../types.ts';

export const domainRequestName: DomainRequestName = 'country';

export interface Fields {
   id: string;
   name: string;
   timezone: string;
}

export function generateFilteringConfig(): FilteringConfig<Fields> {
   return {
      id: {
         filtering: {
            byListOfValue: true,
         },
         values: {
            default: '',
         },
      },
      name: {
         filtering: {
            byRangeOfValue: true,
            byListOfValue: true,
         },
         values: {
            default: '',
         },
      },
      timezone: {
         filtering: {
            byListOfValue: true,
         },
         values: {
            default: '',
         },
      },
   };
}
