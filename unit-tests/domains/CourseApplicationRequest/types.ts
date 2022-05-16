import { DomainRequest, DomainResult } from '../../../src';
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

export type Request = DomainRequest<DomainRequestName, Fields, ExpandableFields>;

export type Result = DomainResult;
