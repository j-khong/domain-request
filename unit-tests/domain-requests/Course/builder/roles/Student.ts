import { SimpleDomainRequestBuilder, buildFilterValidator } from '../../../../mod.ts';
import { DomainRequestName } from '../../../types.ts';
import {
   domainRequestName,
   Fields as MainFields,
   generateFilteringConfig,
   StatusFilterValidatorCreator,
} from '../../types.ts';

const selectedFields = ['id', 'name', 'publishedDate', 'isMultilanguage', 'status'] as const;
type FieldsList = typeof selectedFields[number];
type Fields = Pick<MainFields, FieldsList>;

const fieldMapping = generateFilteringConfig();
fieldMapping.status.values.authorized = ['opened', 'validating'];

export class RequestBuilder extends SimpleDomainRequestBuilder<DomainRequestName, Fields> {
   constructor() {
      super(
         domainRequestName,
         ['id'],
         buildFilterValidator(fieldMapping, {
            customValidatorCreator: new StatusFilterValidatorCreator(),
            authorizedFields: selectedFields.map((v) => v as keyof Fields),
         }),
      );
   }
}
