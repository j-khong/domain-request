import { ExpandableName, FilteringConfig } from '../../mod.ts';
import { DomainRequestName } from '../types.ts';
import * as CourseApplication from '../CourseApplication/index.ts';
import * as Country from '../Country/index.ts';
import * as StudentCategory from '../StudentCategory/index.ts';

export const domainRequestName: DomainRequestName = 'student';

export interface Fields {
   id: string;
   firstname: string;
   lastname: string;
   yearOfBirth: number;
   nationalCardId: string;
   countryId: string;
   categoryId: string;
   hasScholarship: boolean;
   distanceFrom: number;
}

interface Computed {
   distanceFrom: {
      latitude: string;
      longitude: string;
   };
}

export const computedNames: Array<keyof Computed> = ['distanceFrom'];

export function generateFilteringConfig(): FilteringConfig<Fields> {
   return {
      id: { filtering: { byListOfValue: true }, values: { default: '' } },
      firstname: { filtering: { byListOfValue: true }, values: { default: '' } },
      lastname: { filtering: { byListOfValue: true }, values: { default: '' } },
      yearOfBirth: { filtering: { byRangeOfValue: true, byListOfValue: true }, values: { default: 0 } },
      nationalCardId: { filtering: { byListOfValue: true }, values: { default: '' } },
      countryId: { filtering: { byListOfValue: true }, values: { default: '' } },
      categoryId: { filtering: { byListOfValue: true }, values: { default: '' } },
      hasScholarship: { filtering: { byListOfValue: true }, values: { default: false } },
      distanceFrom: { filtering: { byListOfValue: true }, values: { default: 0 } },
   };
}
export interface ExpandableFields {
   country: Country.Fields;
   courseApplication: CourseApplication.Fields;
   category: StudentCategory.Fields;
}

export const expandableNames: Array<ExpandableName<DomainRequestName, ExpandableFields>> = [
   'country',
   'courseApplication',
   { globalContext: 'studentCategory', currentContext: 'category' },
];
