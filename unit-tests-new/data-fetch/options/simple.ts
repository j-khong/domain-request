import { DomainRequestName } from '../../domain-requests/types.ts';
import { test } from '../test.ts';
import { resetClient } from '../../persistence/database/dbUtils.ts';
import { afterEach, /* beforeEach, */ describe, it } from '../mod.ts';

describe('Data fetch with options for simple ', () => {
   afterEach(async () => {
      await resetClient();
   });

   it('requests existing fields with limit of 1', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
         },
         options: {
            limit: 1,
         },
      };

      const expected = {
         domainName: domainRequestName,
         total: 4,
         results: [
            {
               name: 'A',
               id: '1',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests existing fields with limit of 2', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
         },
         options: {
            limit: 2,
         },
      };

      const expected = {
         domainName: domainRequestName,
         total: 4,
         results: [
            {
               name: 'A',
               id: '1',
            },
            {
               name: 'B',
               id: '2',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests existing fields with limit of -1', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
         },
         options: {
            limit: -1,
         },
      };

      const expected = {
         domainName: domainRequestName,
         total: 4,
         results: [
            {
               name: 'A',
               id: '1',
            },
            {
               name: 'B',
               id: '2',
            },
            {
               name: 'C',
               id: '3',
            },
            {
               name: 'D',
               id: '4',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests existing fields with offset of 1', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
         },
         options: {
            offset: 1,
         },
      };

      const expected = {
         domainName: domainRequestName,
         total: 4,
         results: [
            {
               name: 'B',
               id: '2',
            },
            {
               name: 'C',
               id: '3',
            },
            {
               name: 'D',
               id: '4',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests existing fields with offset of 3', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
         },
         options: {
            offset: 3,
         },
      };

      const expected = {
         domainName: domainRequestName,
         total: 4,
         results: [
            {
               name: 'D',
               id: '4',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests existing fields with offset of 4', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
         },
         options: {
            offset: 4,
         },
      };

      const expected = {
         domainName: domainRequestName,
         total: 4,
         results: [],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests existing fields with offset of -1', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
         },
         options: {
            offset: -1,
         },
      };

      const expected = {
         domainName: domainRequestName,
         total: 4,
         results: [
            {
               name: 'A',
               id: '1',
            },
            {
               name: 'B',
               id: '2',
            },
            {
               name: 'C',
               id: '3',
            },
            {
               name: 'D',
               id: '4',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests existing fields with limit of 2 and offset of 1', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
         },
         options: {
            limit: 2,
            offset: 1,
         },
      };

      const expected = {
         domainName: domainRequestName,
         total: 4,
         results: [
            {
               name: 'B',
               id: '2',
            },
            {
               name: 'C',
               id: '3',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
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

   it('requests and order by field also used by joined table', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
            type: {
               name: true,
            },
            architect: {
               name: true,
            },
         },
         filters: {},
         options: {
            limit: 1,
            orderby: 'name asc',
         },
      };

      const expected = {
         domainName: domainRequestName,
         total: 4,
         results: [
            {
               name: 'A',
               type: {
                  name: 'Colonial',
               },
               architect: {
                  name: 'Roberto',
               },
               id: '1',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);

      input.options.orderby = 'name desc';
      const expected2 = {
         domainName: domainRequestName,
         total: 4,
         results: [
            {
               name: 'D',
               type: {
                  name: 'Colonial',
               },
               architect: {
                  name: 'Rodrigo',
               },
               id: '4',
            },
         ],
      };
      await test(input, role, domainRequestName, expected2);
   });

   it('requests and order by field also used by joined table', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            type: {
               name: true,
            },
         },
         filters: {},
         options: {
            limit: 1,
            orderby: 'id asc',
         },
      };

      const expected = {
         domainName: domainRequestName,
         total: 4,
         results: [
            {
               type: {
                  name: 'Colonial',
               },
               id: '1',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);

      input.options.orderby = 'id desc';
      const expected2 = {
         domainName: domainRequestName,
         total: 4,
         results: [
            {
               type: {
                  name: 'Colonial',
               },

               id: '4',
            },
         ],
      };
      await test(input, role, domainRequestName, expected2);
   });
});
