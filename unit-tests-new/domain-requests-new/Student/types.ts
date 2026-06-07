import { FieldConfigFactory, LinkedDomainConfiguration, FieldsSetup, DomainConfig } from '../../mod.ts';
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
      id: FieldConfigFactory.createString({ filtering: { byListOfValue: true } }),
      firstname: FieldConfigFactory.createString({ filtering: { byListOfValue: true } }),
      lastname: FieldConfigFactory.createString({ filtering: { byListOfValue: true } }),
      yearOfBirth: FieldConfigFactory.createNumber({ filtering: { byRangeOfValue: true, byListOfValue: true } }),
      nationalCardId: FieldConfigFactory.createString({ filtering: { byListOfValue: true } }),
      hasScholarship: FieldConfigFactory.createBoolean(),
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
