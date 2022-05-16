import * as CAR from '../CourseApplicationRequest';
import * as CR from '../CountryRequest';
import { DomainRequest } from '../../../src/DomainRequest';

export interface Fields {
   id: string;
   firstname: string;
   lastname: string;
   yearOfBirth: number;
   nationalCardId: string;
   countryId: string;
   hasScholarship: boolean;
}

export interface ExpandableFields {
   country: CR.Fields;
   courseApplication: CAR.Fields;
}

export type Request = DomainRequest<Fields, ExpandableFields>;

export type Result = {};
