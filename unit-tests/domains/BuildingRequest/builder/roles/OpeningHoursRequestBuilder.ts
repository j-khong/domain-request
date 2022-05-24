import { DomainRequest, DomainRequestBuilder, RequestValues, validateNumber, validateString } from '../../../../../src';
import { OpeningHours, TimeSlot } from '../../types';

type Modified = Pick<OpeningHours, 'day'>;
export class OpeningHoursRequestBuilder extends DomainRequestBuilder<'openingHours', Modified, {}> {
   constructor() {
      super(
         'openingHours',
         {
            day: { validate: validateNumber, defaultValue: 0 },
         },
         {
            slots: new SlotsRequestBuilder(),
         },
      );
      this.setExpandables({});
   }
   protected buildRequest(
      values: RequestValues<'openingHours', Modified, {}>,
   ): DomainRequest<'openingHours', Modified, {}> {
      return new DomainRequest<'openingHours', Modified, {}>(
         this.name,
         values.fields,
         values.filters.filters,
         values.expandables,
         values.options.options,
         'day',
      );
   }
}
export class SlotsRequestBuilder extends DomainRequestBuilder<'slots', TimeSlot, {}> {
   constructor() {
      super('slots', {
         start: { validate: validateString, defaultValue: '' },
         end: { validate: validateString, defaultValue: '' },
      });
      this.setExpandables({});
   }
   protected buildRequest(values: RequestValues<'slots', TimeSlot, {}>): DomainRequest<'slots', TimeSlot, {}> {
      return new DomainRequest<'slots', TimeSlot, {}>(
         this.name,
         values.fields,
         values.filters.filters,
         values.expandables,
         values.options.options,
         'start',
      );
   }
}
