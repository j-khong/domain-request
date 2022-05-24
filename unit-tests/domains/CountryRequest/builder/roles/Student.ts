import { DomainRequestName } from '../../../types';
import { DomainRequestBuilder, validateId, validateString } from '../../../../../src/DomainRequest';
import { domainRequestName, ExpandableFields as MainExpandableFields, Fields as MainFields } from '../../types';

type Fields = Pick<MainFields, keyof MainFields>;
type ExpandableFields = Pick<MainExpandableFields, keyof MainExpandableFields>;

export class RequestBuilder extends DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields> {
   constructor() {
      super(domainRequestName, ['id'], {
         id: { validate: validateId, defaultValue: '' },
         name: { validate: validateString, defaultValue: '' },
         timezone: { validate: validateString, defaultValue: '' },
      });
   }
}
