import { DomainConfig as GenericDomain, StringFieldConfiguration, FieldsSetup } from '../../mod2.ts';
import { DomainRequestName } from '../types.ts';

export const domainRequestName: DomainRequestName = 'sponsor';

export interface Fields {
   id: string;
   name: string;
}
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
   };
}
