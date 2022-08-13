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

type Fields = Pick<MainFields, keyof MainFields>;
type Expandables = Pick<MainExpandables, keyof MainExpandables>;

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
         buildFilterValidator<Fields>(generateFilteringConfig(), {
            customValidatorCreator: new StatusFilterValidatorCreator(),
         }),
         {
            openingHours: new OpeningHoursRequestBuilder(),
            pictures: new PictureRequestBuilder(),
         },
      );
   }
}
