import {
   DomainRequest,
   DomainRequestBuilder,
   FilteringFields,
   FilteringFieldsErrors,
   Options,
   OptionsErrors,
   RequestableFields,
   Tree,
   validateId,
   validateNumber,
   validateString,
} from '../../../../../src/DomainRequest';
import { Fields as MainFields } from '../../fields';
import { ExpandableFields as MainExpandableFields } from '../../expandables';
import { DomainRequestName } from '../../../types';

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
      return new Request(fields, filters.filters, expandables, options.options);
   }

   buildDefaultFields(): Fields {
      return {
         id: '',
         firstname: '',
         lastname: '',
         yearOfBirth: 0,
         nationalCardId: '',
         countryId: '',
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
      };
   }
}

class Request extends DomainRequest<Fields, ExpandableFields> {}
