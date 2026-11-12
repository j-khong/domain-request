import { assertEquals } from 'https://deno.land/std@0.149.0/testing/asserts.ts';
import { describe, it } from '../data-fetch/mod.ts';
import {
   createDomainConfig,
   DomainRequestBuilder,
   FieldConfigFactory,
   FieldsSetup,
   ObjectFieldConfiguration,
} from '../mod.ts';

interface Fields {
   id: string;
   address: { zipCode: string };
}

function build(options: unknown) {
   const setup: FieldsSetup<Fields> = {
      id: FieldConfigFactory.createString({}),
      address: new ObjectFieldConfiguration<Fields['address']>({ zipCode: FieldConfigFactory.createString({}) }),
   };
   const builder = new DomainRequestBuilder<'test', Fields>('test', ['id'], createDomainConfig('test', setup));
   return builder.build({ fields: { id: true }, options });
}

describe('Options sanitizing', () => {
   it('accepts the known options', () => {
      const { request, errors } = build({ limit: 10, offset: 20, orderby: 'id desc', address: { limit: 5 } });

      assertEquals(errors, []);
      assertEquals(request.options.pagination, { offset: 20, limit: 10 });
   });

   it('rejects a limit or an offset which is not an integer', () => {
      const { request, errors } = build({ limit: 1.5, offset: 0.5 });

      assertEquals(errors, [
         { context: 'option', fieldName: 'limit', reason: 'not a positive integer' },
         { context: 'option', fieldName: 'offset', reason: 'not a positive integer' },
      ]);
      assertEquals(request.options.pagination, { offset: 0, limit: 100 });
   });

   it('reports the unknown options', () => {
      const { errors } = build({ limitt: 10, id: { limit: 1 }, address: { zipCode: 1, sort: 'asc' } });

      assertEquals(errors, [
         { context: 'option', fieldName: 'zipCode', reason: 'unknown option [zipCode], did you mean [zip_code] ?' },
         { context: 'option', fieldName: 'sort', reason: 'unknown option [sort]' },
         { context: 'option', fieldName: 'limitt', reason: 'unknown option [limitt]' },
         { context: 'option', fieldName: 'id', reason: 'field [id] does not accept options' },
      ]);
   });
});
