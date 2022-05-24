import { DomainRequestName } from '../../../types';
import { DomainRequestBuilder, validateId, validateString } from '../../../../../src/DomainRequest';
import {
   domainRequestName,
   ExpandableFields as MainExpandableFields,
   Fields as MainFields,
   validateStatus,
} from '../../types';
import { OpeningHoursRequestBuilder } from './OpeningHoursRequestBuilder';

type Fields = Pick<MainFields, keyof MainFields>;
type ExpandableFields = Pick<MainExpandableFields, keyof MainExpandableFields>;

export class RequestBuilder extends DomainRequestBuilder<DomainRequestName, Fields, ExpandableFields> {
   constructor() {
      super(
         domainRequestName,
         ['id'],
         {
            id: { validate: validateId, defaultValue: '' },
            name: { validate: validateString, defaultValue: '' },
            status: {
               validate: validateStatus,
               defaultValue: 'opened',
               authorizedValues: ['opened', 'work in progress'],
            },
         },
         {
            openingHours: new OpeningHoursRequestBuilder(),
         },
      );
   }
}
