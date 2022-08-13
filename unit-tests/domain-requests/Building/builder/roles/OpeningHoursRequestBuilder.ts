import {
   DomainWithExtendedRequestBuilder,
   SimpleDomainRequestBuilder,
   FilteringConfig,
   buildFilterValidator,
} from '../../../../mod.ts';
import { OpeningHours, TimeSlot, ExtendedFields } from '../../types.ts';

type Modified = Pick<OpeningHours, 'day'>;
export class OpeningHoursRequestBuilder extends DomainWithExtendedRequestBuilder<
   'openingHours',
   Modified,
   { slots: TimeSlot }
> {
   constructor() {
      super('openingHours', [], buildFilterValidator<OpeningHours>(generateFilteringConfig().openingHours), {
         slots: new SlotsRequestBuilder(),
      });
   }
}
export class SlotsRequestBuilder extends SimpleDomainRequestBuilder<'slots', TimeSlot> {
   constructor() {
      super('slots', [], buildFilterValidator<TimeSlot>(generateFilteringConfig().openingHours.slots));
   }
}

function generateFilteringConfig(): FilteringConfig<Pick<ExtendedFields, 'openingHours'>> {
   return {
      openingHours: {
         day: {
            values: { default: 0 },
         },
         slots: {
            start: {
               values: { default: '' },
            },
            end: {
               values: { default: '' },
            },
         },
      },
   };
}
