import { DomainRequestName } from '../../../types';
import {
   DomainRequest,
   DomainRequestBuilder,
   validateId,
   validateString,
   RequestValues,
} from '../../../../../src/DomainRequest';
import {
   domainRequestName,
   ExpandableFields as MainExpandableFields,
   Fields as MainFields,
   validateStatus,
} from '../../types';
import { OpeningHoursRequestBuilder } from './OpeningHoursRequestBuilder';

type Fields = Pick<MainFields, keyof MainFields>;
type ExpandableFields = Pick<MainExpandableFields, keyof MainExpandableFields>;

export class RequestBuilder extends DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields> {
   constructor() {
      super(
         domainRequestName,
         {
            id: { validate: validateId, defaultValue: '' },
            name: { validate: validateString, defaultValue: '' },
            status: { validate: validateStatus, defaultValue: 'opened' },
         },
         {
            openingHours: new OpeningHoursRequestBuilder(),
         },
      );
   }

   protected buildRequest(
      values: RequestValues<DomainRequestName, Fields, ExpandableFields>,
   ): DomainRequest<DomainRequestName, Fields, ExpandableFields> {
      return new DomainRequest<DomainRequestName, Fields, ExpandableFields>(
         this.name,
         values.fields,
         values.filters.filters,
         values.expandables,
         values.options.options,
         'id',
      );
   }
}
