import { DomainRequest, DomainResult, ExpandableName } from '../../../src';
import * as CR from '../CourseRequest';
import * as SRF from '../StudentRequest';
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

export type Request = DomainRequest<DomainRequestName, Fields, ExpandableFields>;
export type Result = DomainResult;
