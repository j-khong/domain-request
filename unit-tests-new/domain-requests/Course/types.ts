import {
   DomainConfig as GenericDomain,
   StringFieldConfiguration,
   FieldsSetup,
   IsoDateFieldConfiguration,
   NumberFieldConfiguration,
   FieldConfiguration,
   BooleanFieldConfiguration,
   isString,
   IsoDate,
} from '../../mod.ts';
import { DomainRequestName } from '../types.ts';

export const domainRequestName: DomainRequestName = 'course';

export interface Fields {
   id: string;
   name: string;
   publishedDate: IsoDate;
   isMultilanguage: boolean;
   maxSeats: number;
   status: Status;
}

const status = ['opened', 'pending', 'closed', 'validating'] as const;
export type Status = typeof status[number];

export type DomainConfig = GenericDomain<DomainRequestName, Fields>;

export function generateFieldsSetup(): FieldsSetup<Fields> {
   return {
      id: new StringFieldConfiguration({
         filtering: {
            byListOfValue: true,
         },
      }),
      name: new StringFieldConfiguration({
         filtering: {
            byRangeOfValue: true,
            byListOfValue: true,
         },
      }),
      publishedDate: new IsoDateFieldConfiguration({
         filtering: {
            byRangeOfValue: true,
            byListOfValue: true,
         },
      }),
      isMultilanguage: new BooleanFieldConfiguration(),
      maxSeats: new NumberFieldConfiguration({
         filtering: {
            byRangeOfValue: true,
            byListOfValue: true,
         },
      }),
      status: new FieldConfiguration({
         filtering: {
            byListOfValue: true,
         },
         values: {
            default: 'opened',
            typeValidator: isStatus,
            typeName: 'Status',
         },
      }),
   };
}

function isStatus(o: unknown): o is Status {
   return isString(o) && status.includes(o as Status);
}
