import {
   DomainWithExtendedRequestBuilder,
   SimpleDomainRequestBuilder,
   validateNumber,
   validateString,
} from '../../../../../src';
import { OpeningHours, TimeSlot } from '../../types';

type Modified = Pick<OpeningHours, 'day'>;
export class OpeningHoursRequestBuilder extends DomainWithExtendedRequestBuilder<
   'openingHours',
   Modified,
   { slots: TimeSlot }
> {
   constructor() {
      super(
         'openingHours',
         [],
         {
            day: { validate: validateNumber, defaultValue: 0 },
         },
         {
            slots: new SlotsRequestBuilder(),
         },
      );
   }
}
export class SlotsRequestBuilder extends SimpleDomainRequestBuilder<'slots', TimeSlot> {
   constructor() {
      super('slots', [], {
         start: { validate: validateString, defaultValue: '' },
         end: { validate: validateString, defaultValue: '' },
      });
   }
}
