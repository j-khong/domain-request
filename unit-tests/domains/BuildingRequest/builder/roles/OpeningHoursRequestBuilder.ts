import { DomainRequestBuilder, validateNumber, validateString } from '../../../../../src';
import { OpeningHours, TimeSlot } from '../../types';

type Modified = Pick<OpeningHours, 'day'>;
export class OpeningHoursRequestBuilder extends DomainRequestBuilder<'openingHours', Modified, {}> {
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
      this.setExpandables({});
   }
}
export class SlotsRequestBuilder extends DomainRequestBuilder<'slots', TimeSlot, {}> {
   constructor() {
      super('slots', [], {
         start: { validate: validateString, defaultValue: '' },
         end: { validate: validateString, defaultValue: '' },
      });
      this.setExpandables({});
   }
}
