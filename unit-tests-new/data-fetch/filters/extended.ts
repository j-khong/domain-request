import { DomainRequestName } from '../../domain-requests/types.ts';
import { test } from '../test.ts';
import { resetClient } from '../../persistence/database/dbUtils.ts';
import { afterEach, /* beforeEach, */ describe, it } from '../mod.ts';

describe('Data fetch with filter on one to one fields', () => {
   afterEach(async () => {
      await resetClient();
   });

   it('requests 1 1to1 field + filter on it', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            type: { name: true },
         },
         filters: {
            type: {
               name: { operator: 'contains', value: 'e' },
            },
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 1,
         results: [
            {
               type: {
                  name: 'New Age',
               },
               id: '3',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);

      (input as any).filters.type = {
         and: [input.filters.type],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests no fields + filter on 1 1to1 field', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {},
         filters: {
            type: {
               name: { operator: 'contains', value: 'e' },
            },
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 1,
         results: [
            {
               id: '3',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests with 2 1to1 field filters', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            type: { name: true },
         },
         filters: {
            type: {
               name: { operator: 'contains', value: 'e' },
            },
            architect: {
               name: { operator: 'equals', value: 'armando' },
            },
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 1,
         results: [
            {
               type: {
                  name: 'New Age',
               },
               id: '3',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);

      // TODO make these 2 filters work
      //   const input2 = {
      //      fields: {
      //         type: { name: true },
      //      },
      //      filters: {
      //         add: [
      //            {
      //               type: {
      //                  name: { operator: 'contains', value: 'e' },
      //               },
      //            },
      //            {
      //               architect: {
      //                  name: { operator: 'equals', value: 'armando' },
      //               },
      //            },
      //         ],
      //      },
      //   };
      //   await test(input2, role, domainRequestName, expected);
      //   const input3 = {
      //      fields: {
      //         type: { name: true },
      //      },
      //      filters: {
      //         type: {
      //            add: [
      //               {
      //                  name: { operator: 'contains', value: 'e' },
      //               },
      //            ],
      //         },

      //         architect: {
      //            add: [
      //               {
      //                  name: { operator: 'equals', value: 'armando' },
      //               },
      //            ],
      //         },
      //      },
      //   };
      //   await test(input3, role, domainRequestName, expected);

      input.filters.architect.name.value = 'armand';
      const expected2 = {
         domainName: domainRequestName,
         total: 0,
         results: [],
      };
      await test(input, role, domainRequestName, expected2);
   });

   it('requests with 1 1to1 field filter (2 levels)', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
            type: {
               name: true,
            },
         },
         filters: {
            architect: {
               rating: { rate: { operator: 'equals', value: 'B' } },
            },
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 1,
         results: [
            {
               name: 'C',
               type: {
                  name: 'New Age',
               },
               id: '3',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests with 2 1to1 field filters (2 levels)', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
            type: {
               name: true,
            },
         },
         filters: {
            architect: {
               or: [
                  {
                     name: { operator: 'equals', value: 'roberto' },
                  },
                  { rating: { rate: { operator: 'equals', value: 'B' } } },
               ],
            },
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 2,
         results: [
            {
               name: 'A',
               type: {
                  name: 'Colonial',
               },
               id: '1',
            },
            {
               name: 'C',
               type: {
                  name: 'New Age',
               },
               id: '3',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests with 1 1to1 field filter (3 levels)', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
            type: {
               name: true,
            },
         },
         filters: {
            architect: {
               rating: { rater: { name: { operator: 'equals', value: 'S&P' } } },
            },
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 1,
         results: [
            {
               name: 'A',
               type: {
                  name: 'Colonial',
               },
               id: '1',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests with 3 1to1 field filters (3 levels)', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
            type: {
               name: true,
            },
         },
         filters: {
            architect: {
               or: [
                  {
                     name: { operator: 'equals', value: 'roberto' },
                  },
                  { rating: { rate: { operator: 'equals', value: 'B' } } },
                  { rating: { rater: { name: { operator: 'equals', value: 'S&P' } } } },
               ],
            },
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 2,
         results: [
            {
               name: 'A',
               type: {
                  name: 'Colonial',
               },
               id: '1',
            },
            {
               name: 'C',
               type: {
                  name: 'New Age',
               },
               id: '3',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });
});
