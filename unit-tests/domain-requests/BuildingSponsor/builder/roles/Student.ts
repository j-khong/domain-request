import { DomainWithExpandablesRequestBuilder, validateId, validateString } from '../../../../../src/DomainRequest';
import { Fields as MainFields, ExpandableFields as MainExpandableFields, domainRequestName } from '../../types';
import { DomainRequestName } from '../../../types';

type Fields = Pick<MainFields, keyof MainFields>;
type ExpandableFields = Pick<MainExpandableFields, keyof MainExpandableFields>;

export class RequestBuilder extends DomainWithExpandablesRequestBuilder<DomainRequestName, Fields, ExpandableFields> {
   constructor() {
      super(domainRequestName, ['id'], {
         id: { validate: validateId, defaultValue: '' },
         buildingId: { validate: validateString, defaultValue: '' },
         sponsorId: { validate: validateString, defaultValue: '' },
      });
   }
}
