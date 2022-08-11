import { SimpleDomainRequestBuilder, buildFilterValidator } from '../../../../mod.ts';
import { DomainRequestName } from '../../../types.ts';
import { domainRequestName, Fields as MainFields, generateFilteringConfig } from '../../types.ts';

const selectedFields = ['id'] as const;
type FieldsList = typeof selectedFields[number];
type Fields = Pick<MainFields, FieldsList>;

export class RequestBuilder extends SimpleDomainRequestBuilder<DomainRequestName, Fields> {
   constructor() {
      super(
         domainRequestName,
         ['id'],
         buildFilterValidator<Fields>(generateFilteringConfig(), {
            authorizedFields: [],
         }),
      );
   }
}
