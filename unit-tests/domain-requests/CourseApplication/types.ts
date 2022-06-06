import { ExpandableName } from '../../../src';
import * as CR from '../Course';
import * as SRF from '../Student';
import { DomainRequestName } from '../types';

export interface Fields {
   id: string;
   studentId: string;
   courseId: string;
}

export interface ExpandableFields {
   student: SRF.Fields;
   course: CR.Fields;
}

export const domainRequestName: DomainRequestName = 'courseApplication';
export const expandableNames: Array<ExpandableName<DomainRequestName, ExpandableFields>> = ['student', 'course'];
