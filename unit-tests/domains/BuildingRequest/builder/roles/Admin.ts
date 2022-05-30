import { DomainRequestName } from '../../../types';
import { DomainRequestWithExtended, validateId, validateString } from '../../../../../src/DomainRequest';
import { domainRequestName, ExtendedFields, Fields as MainFields, validateStatus } from '../../types';
import { PictureRequestBuilder } from './PictureRequestBuilder';
import { OpeningHoursRequestBuilder } from './OpeningHoursRequestBuilder';

type Fields = Pick<MainFields, keyof MainFields>;

export class RequestBuilder extends DomainRequestWithExtended<DomainRequestName, Fields, ExtendedFields> {
   constructor() {
      super(
         domainRequestName,
         ['id'],
         {
            id: { validate: validateId, defaultValue: '' },
            name: { validate: validateString, defaultValue: '' },
            status: { validate: validateStatus, defaultValue: 'opened' },
         },
         {
            openingHours: new OpeningHoursRequestBuilder(),
            pictures: new PictureRequestBuilder(),
         },
      );
   }
}
