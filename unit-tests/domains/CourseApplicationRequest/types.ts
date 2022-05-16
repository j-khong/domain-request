import { DomainRequest } from '../../../src/DomainRequest';
import * as CR from '../CourseRequest';
import * as SRF from '../StudentRequest';

export interface Fields {
   id: string;
   studentId: string;
   courseId: string;
}

export interface ExpandableFields {
   student: SRF.Fields;
   course: CR.Fields;
}

export type Request = DomainRequest<Fields, ExpandableFields>;

export type Result = {};
