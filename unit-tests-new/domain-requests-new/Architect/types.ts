import { FieldConfigFactory, FieldsSetup, ObjectFieldConfiguration } from '../../mod.ts';
import { DomainRequestName } from '../types.ts';

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
