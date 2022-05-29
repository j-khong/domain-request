import { ExpandableName } from '../../../src';
import * as CourseApplication from '../CourseApplicationRequest';
import * as Country from '../CountryRequest';
import * as StudentCategory from '../StudentCategoryRequest';
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
