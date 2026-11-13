import { StringFieldConfiguration, FieldsSetup } from '../../mod.ts';
import { DomainRequestName } from '../types.ts';

export const domainRequestName: DomainRequestName = 'courseApplication';

export interface Fields {
   id: string;
   studentId: string;
   courseId: string;
}

export function generateFieldsSetup(): FieldsSetup<Fields> {
   return {
      id: new StringFieldConfiguration({ filtering: { byListOfValue: true } }),
      studentId: new StringFieldConfiguration({ filtering: { byListOfValue: true } }),
      courseId: new StringFieldConfiguration({ filtering: { byListOfValue: true } }),
   };
}
