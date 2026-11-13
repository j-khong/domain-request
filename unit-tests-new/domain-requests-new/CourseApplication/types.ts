import { FieldConfigFactory, FieldsSetup } from '../../mod.ts';
import { DomainRequestName } from '../types.ts';

export const domainRequestName: DomainRequestName = 'courseApplication';

export interface Fields {
   id: string;
   studentId: string;
   courseId: string;
}

export function generateFieldsSetup(): FieldsSetup<Fields> {
   return {
      id: FieldConfigFactory.createString({ filtering: { byListOfValue: true } }),
      studentId: FieldConfigFactory.createString({ filtering: { byListOfValue: true } }),
      courseId: FieldConfigFactory.createString({ filtering: { byListOfValue: true } }),
   };
}
