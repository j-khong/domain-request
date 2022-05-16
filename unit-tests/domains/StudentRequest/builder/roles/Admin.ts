import {
   DomainRequest,
   DomainRequestBuilder,
   FilteringFields,
   FilteringFieldsErrors,
   Options,
   OptionsErrors,
   RequestableFields,
   validateBoolean,
   validateId,
   validateNumber,
   validateString,
} from '../../../../../src/DomainRequest';
import { DomainRequestName } from '../../../types';
import { Fields as MainFields, ExpandableFields as MainExpandableFields } from '../../types';

type Fields = Pick<MainFields, keyof MainFields>;
export type ExpandableFields = Pick<MainExpandableFields, keyof MainExpandableFields>;

export class RequestBuilder extends DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields> {
   constructor() {
      super('student', {
         id: validateId,
         firstname: validateString,
         lastname: validateString,
         yearOfBirth: validateNumber,
         nationalCardId: validateString,
         countryId: validateString,
         hasScholarship: validateBoolean,
      });
   }

   protected buildRequest(
      fields: RequestableFields<MainFields>,
      filters: {
         filters: FilteringFields<MainFields>;
         errors: FilteringFieldsErrors;
      },
      expandables: any,
      options: {
         options: Options<MainFields>;
         errors: OptionsErrors;
      },
   ): Request {
      return new Request(this.name, fields, filters.filters, expandables, options.options, 'id');
   }

   buildDefaultFields(): Fields {
      return {
         id: '',
         firstname: '',
         lastname: '',
         yearOfBirth: 0,
         nationalCardId: '',
         countryId: '',
         hasScholarship: false,
      };
   }

   buildDefaultRequestableFields(): RequestableFields<Fields> {
      return {
         id: false,
         firstname: false,
         lastname: false,
         yearOfBirth: false,
         nationalCardId: false,
         countryId: false,
         hasScholarship: false,
      };
   }
}

class Request extends DomainRequest<DomainRequestName, Fields, ExpandableFields> {}
