import { FieldConfigFactory, FieldsSetup } from '/deps/index.ts';
import { DomainRequestName } from '@domains/types.ts';

export const domainRequestName: DomainRequestName = 'country';

export interface Fields {
   id: string;
   name: string;
   timezone: string;
}

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
      timezone: FieldConfigFactory.createString({
         filtering: {
            byListOfValue: true,
         },
      }),
   };
}
