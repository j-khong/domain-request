import { DomainRequestBuilder, validateString } from '../../../../../src';
import { Picture } from '../../types';

type Modified = Pick<Picture, keyof Picture>;
export class PictureRequestBuilder extends DomainRequestBuilder<'pictures', Modified, {}> {
   constructor() {
      super('pictures', [], {
         name: { validate: validateString, defaultValue: '' },
         url: { validate: validateString, defaultValue: '' },
         description: { validate: validateString, defaultValue: '' },
         status: { validate: validateString, defaultValue: '' },
      });
      this.setExpandables({});
   }
}
