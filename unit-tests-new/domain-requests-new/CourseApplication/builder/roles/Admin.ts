import { DomainWithExpandablesRequestBuilder, buildFilterValidator } from '../../../../mod.ts';
import { DomainRequestName } from '../../../types.ts';
import {
   domainRequestName,
   Fields as MainFields,
   ExpandableFields as MainExpandables,
   generateFilteringConfig,
} from '../../types.ts';

type Fields = Pick<MainFields, keyof MainFields>;
type ExpandableFields = Pick<MainExpandables, keyof MainExpandables>;

export class RequestBuilder extends DomainWithExpandablesRequestBuilder<DomainRequestName, Fields, ExpandableFields> {
   constructor() {
      super(domainRequestName, ['id'], buildFilterValidator<Fields>(generateFilteringConfig()));
   }
}
