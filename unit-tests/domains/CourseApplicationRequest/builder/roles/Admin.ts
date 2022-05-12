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
import { Fields as MainFields } from '../../fields';
import { ExpandableFields as MainExpandableFields } from '../../expandables';
import { DomainRequestName } from '../../..';

type Fields = Pick<MainFields, keyof MainFields>;
type ExpandableFields = Pick<MainExpandableFields, keyof MainExpandableFields>;

export class RequestBuilder extends DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields> {
   constructor() {
      super(
         {} as any,
         {
            id: validateId,
            studentId: validateString,
            courseId: validateString,
         },
         'courseApplication',
      );
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

class Request extends DomainRequest<Fields, any> {}
