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

type Fields = Pick<MainFields, keyof MainFields>;
type ExpandableFields = Pick<MainExpandableFields, keyof MainExpandableFields>;

function invalidate(val: any): { valid: boolean; reason: string } {
   return { valid: false, reason: 'openingHours not managed for filters' };
}

export class RequestBuilder extends DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields> {
   constructor() {
      super(domainRequestName, {
         id: { validate: validateId, defaultValue: '' },
         name: { validate: validateString, defaultValue: '' },
         openingHours: { validate: invalidate, defaultValue: [{ day: 0, slots: [] }] },
         status: { validate: validateStatus, defaultValue: 'opened', authorizedValues: ['opened', 'work in progress'] },
      });
   }

   protected buildRequest(values: RequestValues<DomainRequestName, Fields, ExpandableFields>): Request {
      return new Request(
         this.name,
         values.fields,
         values.filters.filters,
         values.expandables,
         values.options.options,
         'id',
      );
   }
}

class Request extends DomainRequest<DomainRequestName, Fields, ExpandableFields> {}
