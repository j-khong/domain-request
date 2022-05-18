import * as CAR from '../CourseApplicationRequest';
import * as CR from '../CountryRequest';
import * as Cat from '../StudentCategoryRequest';
import { DomainRequest, DomainResult } from '../../../src';
import { DomainRequestName } from '../types';

export interface Fields {
   id: string;
   firstname: string;
   lastname: string;
   yearOfBirth: number;
   nationalCardId: string;
   countryId: string;
   categoryId: string;
   hasScholarship: boolean;
}

export interface ExpandableFields {
   country: CR.Fields;
   courseApplication: CAR.Fields;
   category: Cat.Fields;
}

export type Request = DomainRequest<DomainRequestName, Fields, ExpandableFields>;

export type Result = DomainResult;
