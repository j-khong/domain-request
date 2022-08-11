import { DomainRequestName } from '../domain-requests/types.ts';
import { test } from './test.ts';
import { resetClient } from '../persistence/database/dbUtils.ts';
import { afterEach, /* beforeEach, */ describe, it } from './mod.ts';

describe('User role restriction', () => {
   afterEach(async () => {
      await resetClient();
   });

   it('Full access user can get data', async () => {
      const domainRequestName: DomainRequestName = 'studentCategory';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
         },
      };

      const expected = {
         domainName: domainRequestName,
         total: 2,
         results: [
            {
               id: '1',
               name: 'Arts',
            },
            {
               id: '2',
               name: 'Sports',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('Full restricted user cannot get data', async () => {
      const domainRequestName: DomainRequestName = 'studentCategory';
      const role = 'student';
      const input = {
         fields: {
            name: true,
         },
      };

      const expected = {
         domainName: domainRequestName,
         total: 0,
         results: [],
      };
      await test(input, role, domainRequestName, expected);
   });
});
