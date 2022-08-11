import { FilteringConfig } from '../../mod.ts';
import { DomainRequestName } from '../types.ts';

export const domainRequestName: DomainRequestName = 'studentCategory';

export interface Fields {
   id: string;
   name: string;
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
   };
}
