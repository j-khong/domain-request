import { ExpandableName } from '../../../src';
import * as CourseApplication from '../CourseApplication';
import * as Country from '../Country';
import * as StudentCategory from '../StudentCategory';
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
   country: Country.Fields;
   courseApplication: CourseApplication.Fields;
   category: StudentCategory.Fields;
}

export const domainRequestName: DomainRequestName = 'student';
export const expandableNames: Array<ExpandableName<DomainRequestName, ExpandableFields>> = [
   'country',
   'courseApplication',
   { globalContext: 'studentCategory', currentContext: 'category' },
];
