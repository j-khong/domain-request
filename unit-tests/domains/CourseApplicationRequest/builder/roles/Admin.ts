import {
   DomainRequest,
   DomainRequestBuilder,
   validateId,
   validateString,
   RequestValues,
} from '../../../../../src/DomainRequest';
import { Fields as MainFields, ExpandableFields as MainExpandableFields } from '../../types';
import { DomainRequestName } from '../../../types';

type Fields = Pick<MainFields, keyof MainFields>;
type ExpandableFields = Pick<MainExpandableFields, keyof MainExpandableFields>;

export class RequestBuilder extends DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields> {
   constructor() {
      super('courseApplication', {
         id: { validate: validateId, defaultValue: '' },
         studentId: { validate: validateString, defaultValue: '' },
         courseId: { validate: validateString, defaultValue: '' },
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

class Request extends DomainRequest<DomainRequestName, Fields, any> {}
