import * as CR from '../CourseRequest';
import * as SRF from '../StudentRequest/fields';

export interface ExpandableFields {
   student: SRF.Fields;
   course: CR.Fields;
}
