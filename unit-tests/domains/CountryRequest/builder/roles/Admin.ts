import { DomainRequestName } from '../../../types';
import {
   DomainFields,
   DomainRequest,
   DomainRequestBuilder,
   FilteringFields,
   FilteringFieldsErrors,
   Options,
   OptionsErrors,
   RequestableFields,
   validateId,
   validateString,
} from '../../../../../src/DomainRequest';
import { ExpandableFields as MainExpandableFields, Fields as MainFields } from '../../types';

type Fields = Pick<MainFields, keyof MainFields>;
type ExpandableFields = Pick<MainExpandableFields, keyof MainExpandableFields>;

export class RequestBuilder extends DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields> {
   constructor() {
      super('country', {
         id: validateId,
         name: validateString,
         timezone: validateString,
      });
   }

   protected buildRequest(
      fields: RequestableFields<MainFields>,
      filters: {
         filters: FilteringFields<MainFields>;
         errors: FilteringFieldsErrors;
      },
      expandables: {
         [Property in keyof MainExpandableFields]: DomainRequest<MainExpandableFields[Property], DomainFields>;
      },
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
         name: '',
         timezone: '',
      };
   }

   buildDefaultRequestableFields(): RequestableFields<Fields> {
      return {
         id: false,
         name: false,
         timezone: false,
      };
   }
}

class Request extends DomainRequest<Fields, ExpandableFields> {}
