import { FieldConfigFactory, FieldsSetup } from '../../mod.ts';
import { DomainRequestName } from '../types.ts';

export const domainRequestName: DomainRequestName = 'studentCategory';

export interface Fields {
   id: string;
   name: string;
   otherData: string;
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
      otherData: FieldConfigFactory.createString({}),
   };
}
