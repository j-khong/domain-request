import * as CR from '../CourseRequest';
import * as SRF from '../StudentRequest';

export interface ExpandableFields {
   student: SRF.Fields;
   course: CR.Fields;
}
