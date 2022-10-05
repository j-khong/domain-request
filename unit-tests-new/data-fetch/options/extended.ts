import { DomainRequestName } from '../../domain-requests/types.ts';
import { test } from '../test.ts';
import { resetClient } from '../../persistence/database/dbUtils.ts';
import { afterEach, /* beforeEach, */ describe, it } from '../mod.ts';

describe('Data fetch with options for extended ', () => {
   afterEach(async () => {
      await resetClient();
   });

   it('order by on a level 1 extended', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
            architect: {
               name: true,
               id: true,
            },
         },
         options: { architect: { orderby: 'name desc' } },
      };

      const expected = {
         domainName: domainRequestName,
         total: 4,
         results: [
            {
               name: 'D',
               architect: {
                  id: '3',
                  name: 'Rodrigo',
               },
               id: '4',
            },
            {
               name: 'A',
               architect: {
                  id: '1',
                  name: 'Roberto',
               },
               id: '1',
            },
            {
               name: 'B',
               architect: {
                  id: '2',
                  name: 'Ricardo',
               },
               id: '2',
            },
            {
               name: 'C',
               architect: {
                  id: '4',
                  name: 'Armando',
               },
               id: '3',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('order by a field and a level 1 extended', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
            architect: {
               name: true,
               id: true,
            },
         },
         options: { orderby: 'id desc', architect: { orderby: 'name desc' } },
      };

      const expected = {
         domainName: domainRequestName,
         total: 4,
         results: [
            {
               name: 'D',
               architect: {
                  id: '3',
                  name: 'Rodrigo',
               },
               id: '4',
            },
            {
               name: 'C',
               architect: {
                  id: '4',
                  name: 'Armando',
               },
               id: '3',
            },
            {
               name: 'B',
               architect: {
                  id: '2',
                  name: 'Ricardo',
               },
               id: '2',
            },
            {
               name: 'A',
               architect: {
                  id: '1',
                  name: 'Roberto',
               },
               id: '1',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });
});
