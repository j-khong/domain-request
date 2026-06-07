import {
   StringFieldConfiguration,
   NumberFieldConfiguration,
   BooleanFieldConfiguration,
   LinkedDomainConfiguration,
   FieldsSetup,
   DomainConfig,
} from '../../mod.ts';
import { DomainRequestName, Role } from '../types.ts';
import * as Country from '../Country/index.ts';
import * as StudentCategory from '../StudentCategory/index.ts';

export const domainRequestName: DomainRequestName = 'student';

export interface Fields {
   id: string;
   firstname: string;
   lastname: string;
   yearOfBirth: number;
   nationalCardId: string;
   hasScholarship: boolean;
   country: Country.Fields;
   category: StudentCategory.Fields;
}

export function generateFieldsSetup(): FieldsSetup<Fields> {
   return {
      id: new StringFieldConfiguration({ filtering: { byListOfValue: true } }),
      firstname: new StringFieldConfiguration({ filtering: { byListOfValue: true } }),
      lastname: new StringFieldConfiguration({ filtering: { byListOfValue: true } }),
      yearOfBirth: new NumberFieldConfiguration({ filtering: { byRangeOfValue: true, byListOfValue: true } }),
      nationalCardId: new StringFieldConfiguration({ filtering: { byListOfValue: true } }),
      hasScholarship: new BooleanFieldConfiguration(),
      country: new LinkedDomainConfiguration<DomainRequestName, Country.Fields>(
         domainRequestName,
         Country.domainRequestName,
      ),
      category: new LinkedDomainConfiguration<DomainRequestName, StudentCategory.Fields>(
         domainRequestName,
         StudentCategory.domainRequestName,
      ),
   };
}

export function initDomainConfigWithDeps(dc: DomainConfig<DomainRequestName, Fields>, role: Role): void {
   const c = dc.fields.getConf();
   if (c.country !== undefined) {
      c.country.init(Country.createDomainConfig(role));
   }
   if (c.category !== undefined) {
      c.category.init(StudentCategory.createDomainConfig(role));
   }
}
