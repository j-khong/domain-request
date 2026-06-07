import { FieldConfigFactory, FieldsSetup, FieldConfiguration, isString, IsoDate } from '../../mod.ts';
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
export type Status = (typeof status)[number];

export function generateFieldsSetup(): FieldsSetup<Fields> {
   return {
      id: FieldConfigFactory.createString({
         filtering: {
            byListOfValue: true,
         },
      }),
      name: FieldConfigFactory.createString({
         filtering: {
            byRangeOfValue: true,
            byListOfValue: true,
         },
      }),
      publishedDate: FieldConfigFactory.createIsoDate({
         filtering: {
            byRangeOfValue: true,
            byListOfValue: true,
         },
      }),
      isMultilanguage: FieldConfigFactory.createBoolean(),
      maxSeats: FieldConfigFactory.createNumber({
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
