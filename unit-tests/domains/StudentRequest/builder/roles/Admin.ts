import {
   DomainWithExpandablesRequestBuilder,
   validateBoolean,
   validateId,
   validateNumber,
   validateString,
} from '../../../../../src/DomainRequest';
import { DomainRequestName } from '../../../types';
import { Fields as MainFields, ExpandableFields as MainExpandableFields, domainRequestName } from '../../types';

type Fields = Pick<MainFields, keyof MainFields>;
export type ExpandableFields = Pick<MainExpandableFields, keyof MainExpandableFields>;

export class RequestBuilder extends DomainWithExpandablesRequestBuilder<DomainRequestName, Fields, ExpandableFields> {
   constructor() {
      super(domainRequestName, ['id'], {
         id: { validate: validateId, defaultValue: '' },
         firstname: { validate: validateString, defaultValue: '' },
         lastname: { validate: validateString, defaultValue: '' },
         yearOfBirth: { validate: validateNumber, defaultValue: 1970 },
         nationalCardId: { validate: validateString, defaultValue: '' },
         countryId: { validate: validateString, defaultValue: '' },
         hasScholarship: { validate: validateBoolean, defaultValue: false },
         categoryId: { validate: validateString, defaultValue: '' },
      });
   }
}
