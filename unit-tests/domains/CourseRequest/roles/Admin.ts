import { DomainRequestName } from '../..';
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
} from '../../../../src/DomainRequest';
import { User } from '../../User';
import {
   ExpandableExpFields as MainExpandableExpFields,
   ExpandableFields as MainExpandableFields,
   Fields as MainFields,
} from '../types';

type Fields = Pick<MainFields, keyof MainFields>;
type ExpandableFields = Pick<MainExpandableFields, keyof MainExpandableFields>;

export class RequestBuilder extends DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields> {
   constructor(user: User) {
      super(
         user,
         {
            id: validateId,
            name: validateString,
         },
         'course',
      );
   }

   protected buildRequest(
      fields: RequestableFields<MainFields>,
      filters: {
         filters: FilteringFields<MainFields>;
         errors: FilteringFieldsErrors;
      },
      expandables: {
         [Property in keyof MainExpandableFields]: DomainRequest<
            MainExpandableFields[Property],
            MainExpandableExpFields[Property]
         >;
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
      };
   }

   buildDefaultRequestableFields(): RequestableFields<Fields> {
      return {
         id: false,
         name: false,
      };
   }
}

class Request extends DomainRequest<Fields, ExpandableFields> {}
