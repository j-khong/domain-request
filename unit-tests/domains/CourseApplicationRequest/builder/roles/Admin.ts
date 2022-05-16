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
   validateString,
} from '../../../../../src/DomainRequest';
import { Fields as MainFields, ExpandableFields as MainExpandableFields } from '../../types';
import { DomainRequestName } from '../../../types';

type Fields = Pick<MainFields, keyof MainFields>;
type ExpandableFields = Pick<MainExpandableFields, keyof MainExpandableFields>;

export class RequestBuilder extends DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields> {
   constructor() {
      super('courseApplication', {
         id: validateId,
         studentId: validateString,
         courseId: validateString,
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
         studentId: '',
         courseId: '',
      };
   }

   buildDefaultRequestableFields(): RequestableFields<Fields> {
      return {
         id: false,
         studentId: false,
         courseId: false,
      };
   }
}

class Request extends DomainRequest<DomainRequestName, Fields, any> {}
