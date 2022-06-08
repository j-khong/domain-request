import { DomainRequestName } from '../../../types';
import { SimpleDomainRequestBuilder, validateId, validateString } from '../../../../../src/DomainRequest';
import { domainRequestName, Fields as MainFields } from '../../types';

type Fields = Pick<MainFields, keyof MainFields>;

export class RequestBuilder extends SimpleDomainRequestBuilder<DomainRequestName, Fields> {
   constructor() {
      super(domainRequestName, ['id'], {
         id: { validate: validateId, defaultValue: '' },
         name: { validate: validateString, defaultValue: '' },
      });
   }
}
