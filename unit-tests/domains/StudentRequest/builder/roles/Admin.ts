import {
   DomainRequest,
   DomainRequestBuilder,
   validateBoolean,
   validateId,
   validateNumber,
   validateString,
   RequestValues,
} from '../../../../../src/DomainRequest';
import { DomainRequestName } from '../../../types';
import { Fields as MainFields, ExpandableFields as MainExpandableFields } from '../../types';

type Fields = Pick<MainFields, keyof MainFields>;
export type ExpandableFields = Pick<MainExpandableFields, keyof MainExpandableFields>;

export class RequestBuilder extends DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields> {
   constructor() {
      super('student', {
         id: { validate: validateId, defaultValue: '' },
         firstname: { validate: validateString, defaultValue: '' },
         lastname: { validate: validateString, defaultValue: '' },
         yearOfBirth: { validate: validateNumber, defaultValue: 1970 },
         nationalCardId: { validate: validateString, defaultValue: '' },
         countryId: { validate: validateString, defaultValue: '' },
         hasScholarship: { validate: validateBoolean, defaultValue: false },
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
