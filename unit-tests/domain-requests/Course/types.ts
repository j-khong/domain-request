import { isString, FilteringConfig, ConcreteFilterValidatorCreator } from '../../mod.ts';
import { DomainRequestName } from '../types.ts';

export const domainRequestName: DomainRequestName = 'course';

export interface Fields {
   id: string;
   name: string;
   publishedDate: Date;
   isMultilanguage: boolean;
   maxSeats: number;
   status: Status;
}

const status = ['opened', 'pending', 'closed', 'validating'] as const;
export type Status = typeof status[number];

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
      publishedDate: {
         filtering: {
            byRangeOfValue: true,
            byListOfValue: true,
         },
         values: {
            default: new Date(),
         },
      },
      isMultilanguage: {
         values: {
            default: true,
         },
      },
      maxSeats: {
         filtering: {
            byRangeOfValue: true,
            byListOfValue: true,
         },
         values: {
            default: 0,
         },
      },
      status: {
         filtering: {
            byListOfValue: true,
         },
         values: {
            default: 'opened',
         },
      },
   };
}

export class StatusFilterValidatorCreator<Fields> extends ConcreteFilterValidatorCreator<Fields, Status> {
   constructor() {
      super(isStatus, 'Status');
   }
}

function isStatus(o: unknown): o is Status {
   return isString(o) && status.includes(o as Status);
}
