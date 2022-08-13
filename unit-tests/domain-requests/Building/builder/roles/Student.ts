import { DomainWithExtendedAndExpandablesRequestBuilder, buildFilterValidator } from '../../../../mod.ts';
import { DomainRequestName } from '../../../types.ts';
import {
   domainRequestName,
   ExtendedFields,
   Fields as MainFields,
   ExpandableFields as MainExpandables,
   generateFilteringConfig,
   StatusFilterValidatorCreator,
} from '../../types.ts';

import { PictureRequestBuilder } from './PictureRequestBuilder.ts';
import { OpeningHoursRequestBuilder } from './OpeningHoursRequestBuilder.ts';

const selectedFields = ['id', 'name', 'status'] as const;
type FieldsList = typeof selectedFields[number];
type Fields = Pick<MainFields, FieldsList>;
type Expandables = Pick<MainExpandables, keyof MainExpandables>;

const fieldMapping = generateFilteringConfig();
fieldMapping.status.values.authorized = ['opened', 'work in progress'];

export class RequestBuilder extends DomainWithExtendedAndExpandablesRequestBuilder<
   DomainRequestName,
   Fields,
   ExtendedFields,
   Expandables
> {
   constructor() {
      super(
         domainRequestName,
         ['id'],
         buildFilterValidator(fieldMapping, {
            customValidatorCreator: new StatusFilterValidatorCreator(),
            authorizedFields: selectedFields.map((v) => v as keyof Fields),
         }),
         {
            openingHours: new OpeningHoursRequestBuilder(),
            pictures: new PictureRequestBuilder(),
         },
      );
   }
}
