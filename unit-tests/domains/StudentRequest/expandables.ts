import * as CAR from '../CourseApplicationRequest/fields';
import * as CR from '../CountryRequest';

export interface ExpandableFields {
   country: CR.Fields;
   courseApplication: CAR.Fields;
}
