import * as CAR from '../CourseApplicationRequest';
import * as CR from '../CountryRequest';
import { DomainRequest, DomainResult } from '../../../src';
import { DomainRequestName } from '../types';

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

export type Request = DomainRequest<DomainRequestName, Fields, ExpandableFields>;

export type Result = DomainResult;
