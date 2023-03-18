import { FieldsSetup, StringFieldConfiguration } from "@jkhong/domain-request"
import { DomainRequestName } from '@domains/types';

export const domainRequestName: DomainRequestName = 'country';

export interface Fields {
   id: string;
   name: string;
   timezone: string;
}

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
      timezone: new StringFieldConfiguration({
         filtering: {
            byListOfValue: true,
         },
      }),
   };
}
