import { DomainRequestName } from '../../../types.ts';
import { SimpleDomainRequestBuilder, validateId, validateString } from '../../../../../src/DomainRequest/index.ts';
import { domainRequestName, Fields as MainFields } from '../../types.ts';

type Fields = Pick<MainFields, keyof MainFields>;

export class RequestBuilder extends SimpleDomainRequestBuilder<DomainRequestName, Fields> {
   constructor() {
      super(domainRequestName, ['id'], {
         id: { validate: validateId, defaultValue: '' },
         name: { validate: validateString, defaultValue: '' },
      });
   }
}
