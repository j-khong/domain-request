import { DomainRequestName } from '../../domain-requests/types.ts';
import { test } from '../test.ts';
import { resetClient } from '../../persistence/database/dbUtils.ts';
import { afterEach, /* beforeEach, */ describe, it } from '../mod.ts';

describe('Data fetch with options for simple ', () => {
   afterEach(async () => {
      await resetClient();
   });

   it('requests existing fields with limit and order by desc', async () => {
      const domainRequestName: DomainRequestName = 'country';
      const role = 'student';
      const input = {
         fields: {
            name: true,
            timezone: true,
         },
         filters: {},
         options: {
            limit: 1,
            orderby: 'id desc',
         },
      };

      const expected = {
         domainName: domainRequestName,
         total: 2,
         results: [
            {
               name: 'espagne',
               timezone: 'Europe/Madrid',
               id: '2',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests existing fields with limit and order by asc', async () => {
      const domainRequestName: DomainRequestName = 'country';
      const role = 'student';
      const input = {
         fields: {
            name: true,
            timezone: true,
         },
         filters: {},
         options: {
            limit: 1,
            orderby: 'id asc',
         },
      };

      const expected = {
         domainName: domainRequestName,
         total: 2,
         results: [
            {
               name: 'france',
               timezone: 'Europe/Paris',
               id: '1',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });
});
