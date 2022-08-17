import { SimpleDomainRequestBuilder, buildFilterValidator } from '../../../../mod.ts';
import { DomainRequestName } from '../../../types.ts';
import { domainRequestName, Fields as MainFields, generateFilteringConfig } from '../../types.ts';

type Fields = Pick<MainFields, keyof MainFields>;

export class RequestBuilder extends SimpleDomainRequestBuilder<DomainRequestName, Fields> {
   constructor() {
      super(domainRequestName, ['id'], buildFilterValidator<Fields>(generateFilteringConfig()));
   }
}

export const admin = new RequestBuilder();
