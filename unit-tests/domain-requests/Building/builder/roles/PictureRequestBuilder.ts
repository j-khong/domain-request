import { SimpleDomainRequestBuilder, FilteringConfig, buildFilterValidator } from '../../../../mod.ts';
import { Picture, ExtendedFields } from '../../types.ts';

type Modified = Pick<Picture, keyof Picture>;
export class PictureRequestBuilder extends SimpleDomainRequestBuilder<'pictures', Modified> {
   constructor() {
      super('pictures', [], buildFilterValidator<Picture>(generateFilteringConfig().pictures));
   }
}

function generateFilteringConfig(): FilteringConfig<Pick<ExtendedFields, 'pictures'>> {
   return {
      pictures: {
         url: {
            values: { default: '' },
         },
         name: {
            values: { default: '' },
         },
         description: {
            values: { default: '' },
         },
         status: {
            values: { default: '' },
         },
      },
   };
}
