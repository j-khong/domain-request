import { DomainRequestName } from '../../../types';
import {
   DomainWithExtendedAndExpandablesRequestBuilder,
   validateId,
   validateString,
} from '../../../../../src/DomainRequest';
import {
   domainRequestName,
   ExtendedFields,
   Fields as MainFields,
   ExpandableFields as MainExpandables,
   validateStatus,
} from '../../types';
import { PictureRequestBuilder } from './PictureRequestBuilder';
import { OpeningHoursRequestBuilder } from './OpeningHoursRequestBuilder';

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
         {
            id: { validate: validateId, defaultValue: '' },
            name: { validate: validateString, defaultValue: '' },
            status: { validate: validateStatus, defaultValue: 'opened' },
            privateField: { validate: validateString, defaultValue: '' },
         },
         {
            openingHours: new OpeningHoursRequestBuilder(),
            pictures: new PictureRequestBuilder(),
         },
      );
   }
}
