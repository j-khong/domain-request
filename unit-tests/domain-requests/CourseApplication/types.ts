import { FilteringConfig, ExpandableName } from '../../mod.ts';
import { DomainRequestName } from '../types.ts';
import * as CR from '../Course/index.ts';
import * as SRF from '../Student/index.ts';

export const domainRequestName: DomainRequestName = 'courseApplication';

export interface Fields {
   id: string;
   studentId: string;
   courseId: string;
}

export function generateFilteringConfig(): FilteringConfig<Fields> {
   return {
      id: {
         filtering: {
            byListOfValue: true,
         },
         values: { default: '' },
      },
      studentId: {
         filtering: {
            byListOfValue: true,
         },
         values: { default: '' },
      },
      courseId: {
         filtering: {
            byListOfValue: true,
         },
         values: { default: '' },
      },
   };
}
export interface ExpandableFields {
   student: SRF.Fields;
   course: CR.Fields;
}

export const expandableNames: Array<ExpandableName<DomainRequestName, ExpandableFields>> = ['student', 'course'];
