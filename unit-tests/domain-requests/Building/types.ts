import { ExpandableName, isString, FilteringConfig, ConcreteFilterValidatorCreator } from '../../mod.ts';
import { DomainRequestName } from '../types.ts';
import * as BuildingSponsor from '../BuildingSponsor/index.ts';

export const domainRequestName: DomainRequestName = 'building';

export interface Fields {
   id: string;
   name: string;
   status: Status;
   privateField: string;
}

export interface ExtendedFields {
   openingHours: OpeningHours[];
   pictures: Picture[];
}

export interface ExpandableFields {
   sponsors: BuildingSponsor.Fields;
}
export const expandableNames: Array<ExpandableName<DomainRequestName, ExpandableFields>> = [
   { globalContext: 'buildingSponsor', currentContext: 'sponsors' },
];

export interface Picture {
   url: string;
   name: string;
   description: string;
   status: string;
}
export interface OpeningHours {
   day: number;
   slots: TimeSlot[];
}
export interface TimeSlot {
   start: string;
   end: string;
}

const status = ['opened', 'closed', 'work in progress'] as const;
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
      status: {
         filtering: {
            byListOfValue: true,
         },
         values: {
            default: 'opened',
            authorized: [],
         },
      },
      privateField: {
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
export class StatusFilterValidatorCreator<Fields> extends ConcreteFilterValidatorCreator<Fields, Status> {
   constructor() {
      super(isStatus, 'Status');
   }
}

function isStatus(o: any): o is Status {
   return isString(o) && status.includes(o as Status);
}
