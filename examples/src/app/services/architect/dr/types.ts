import { FieldConfigFactory, FieldsSetup, ObjectFieldConfiguration } from '/deps/index.ts';
import { DomainRequestName } from '@domains/types.ts';

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
      id: FieldConfigFactory.createString({
         filtering: {
            byListOfValue: true,
         },
      }),
      name: FieldConfigFactory.createString({
         filtering: {
            byRangeOfValue: true,
            byListOfValue: true,
         },
      }),
      rating: new ObjectFieldConfiguration<Rating>({
         rate: FieldConfigFactory.createString({
            filtering: {
               byRangeOfValue: true,
               byListOfValue: true,
            },
         }),
         rater: new ObjectFieldConfiguration<Rater>({
            name: FieldConfigFactory.createString({
               filtering: {
                  byRangeOfValue: true,
                  byListOfValue: true,
               },
            }),
         }),
      }),
   };
}
