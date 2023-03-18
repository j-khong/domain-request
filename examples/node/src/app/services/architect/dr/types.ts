import { FieldsSetup, ObjectFieldConfiguration, StringFieldConfiguration } from "@jkhong/domain-request";
import { DomainRequestName } from '@domains/types';

export const domainRequestName: DomainRequestName = 'architect';

export interface Fields {
   id: string;
   name: string;
   // specialities: string;
   rating: Rating;
}

export interface Rating {
   rate: string;
   rater: Rater;
}
export interface Rater {
   name: string;
}

export function generateFieldsSetup(): FieldsSetup<Fields> {
   return {
      id: new StringFieldConfiguration({
         filtering: {
            byListOfValue: true,
         },
      }),
      name: new StringFieldConfiguration({
         filtering: {
            byRangeOfValue: true,
            byListOfValue: true,
         },
      }),
      rating: new ObjectFieldConfiguration<Rating>({
         rate: new StringFieldConfiguration({
            filtering: {
               byRangeOfValue: true,
               byListOfValue: true,
            },
         }),
         rater: new ObjectFieldConfiguration<Rater>({
            name: new StringFieldConfiguration({
               filtering: {
                  byRangeOfValue: true,
                  byListOfValue: true,
               },
            }),
         }),
      }),
   };
}
