import { DomainRequestName } from '../../../types';
import {
   DomainRequest,
   DomainRequestBuilder,
   validateId,
   validateString,
   RequestValues,
} from '../../../../../src/DomainRequest';
import { domainRequestName, ExpandableFields as MainExpandableFields, Fields as MainFields } from '../../types';

type Fields = Pick<MainFields, keyof MainFields>;
type ExpandableFields = Pick<MainExpandableFields, keyof MainExpandableFields>;

export class RequestBuilder extends DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields> {
   constructor() {
      super(domainRequestName, {
         id: { validate: validateId, defaultValue: '' },
         name: { validate: validateString, defaultValue: '' },
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
