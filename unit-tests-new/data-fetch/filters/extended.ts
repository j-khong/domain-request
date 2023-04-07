import { DomainRequestName } from '../../domain-requests/types.ts';
import { test, testSpecial } from '../test.ts';
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
      const results = [
         {
            type: { name: 'New Age' },
            id: '3',
         },
      ];
      const expected = {
         domainName: domainRequestName,
         total: results.length,
         results,
      };
      await test(input, role, domainRequestName, expected);

      (input as any).filters = {
         and: [input.filters],
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
      const results = [{ id: '3' }];
      const expected = {
         domainName: domainRequestName,
         total: results.length,
         results,
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
      let results = [
         {
            type: { name: 'New Age' },
            id: '3',
         },
      ];
      const expected = {
         domainName: domainRequestName,
         total: results.length,
         results,
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
      results = [];
      const expected2 = {
         domainName: domainRequestName,
         total: results.length,
         results,
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
      const results = [
         {
            name: 'C',
            type: { name: 'New Age' },
            id: '3',
         },
      ];
      const expected = {
         domainName: domainRequestName,
         total: results.length,
         results,
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
      const results = [
         {
            name: 'A',
            type: { name: 'Colonial' },
            id: '1',
         },
         {
            name: 'C',
            type: { name: 'New Age' },
            id: '3',
         },
      ];
      const expected = {
         domainName: domainRequestName,
         total: results.length,
         results,
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
      const results = [
         {
            name: 'A',
            type: { name: 'Colonial' },
            id: '1',
         },
      ];
      const expected = {
         domainName: domainRequestName,
         total: results.length,
         results,
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
      const results = [
         {
            name: 'A',
            type: { name: 'Colonial' },
            id: '1',
         },
         {
            name: 'C',
            type: { name: 'New Age' },
            id: '3',
         },
      ];
      const expected = {
         domainName: domainRequestName,
         total: results.length,
         results,
      };
      await test(input, role, domainRequestName, expected);
   });
});

describe('Data fetch with filter on one to N fields', () => {
   afterEach(async () => {
      await resetClient();
   });

   it('requests with 1 1toN field + filter main resource on it', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            sponsors: { name: true },
         },
         filters: {
            sponsors: {
               name: { operator: 'contains', value: 'e' },
            },
         },
      };
      const results = [
         {
            id: '1',
            sponsors: [{ name: 'Rockefeller' }, { name: 'Carnegie' }],
         },
         {
            id: '2',
            sponsors: [{ name: 'Carnegie' }],
         },
         {
            id: '3',
            sponsors: [{ name: 'Ford' }, { name: 'Vanderbilt' }],
         },
      ];
      const expected = {
         domainName: domainRequestName,
         total: results.length,
         results,
      };
      await test(input, role, domainRequestName, expected);

      (input as any).filters = {
         and: [input.filters],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests with 1 1toN field + filter main resource on it + filter 1toN field results', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            sponsors: { name: true },
         },
         filters: {
            sponsors: {
               name: { operator: 'contains', value: 'e' },
            },
         },
         options: {
            sponsors: {
               use_filter: true,
            },
         },
      };
      const results = [
         {
            id: '1',
            sponsors: [{ name: 'Carnegie' }, { name: 'Rockefeller' }],
         },
         {
            id: '2',
            sponsors: [{ name: 'Carnegie' }],
         },
         {
            id: '3',
            sponsors: [{ name: 'Vanderbilt' }],
         },
      ];
      const expected = {
         domainName: domainRequestName,
         total: results.length,
         results,
      };
      await test(input, role, domainRequestName, expected);

      (input as any).filters = {
         and: [input.filters],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests no fields + filter main resource on 1 1toN field', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {},
         filters: {
            sponsors: {
               name: { operator: 'contains', value: 'e' },
            },
         },
      };
      const results = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const expected = {
         domainName: domainRequestName,
         total: results.length,
         results,
      };
      await test(input, role, domainRequestName, expected);

      (input as any).filters = {
         and: [input.filters],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests no fields + filter main resource on 1 1toN field + filter 1toN field results', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {},
         filters: {
            sponsors: {
               name: { operator: 'contains', value: 'e' },
            },
         },
         options: {
            sponsors: {
               use_filter: true,
            },
         },
      };
      const results = [{ id: '1' }, { id: '2' }, { id: '3' }];
      const expected = {
         domainName: domainRequestName,
         total: results.length,
         results,
      };
      await test(input, role, domainRequestName, expected);

      (input as any).filters = {
         and: [input.filters],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests with 2 1toN fields filters and filter on it', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            sponsors: { name: true },
            opening_hours: { day: true, slots: { start: true, end: true } },
         },
         filters: {
            or: [
               {
                  sponsors: { name: { operator: 'contains', value: 'gan' } },
               },
               {
                  opening_hours: {
                     day: {
                        operator: 'equals',
                        value: 1,
                     },
                  },
               },
            ],
         },
      };
      const results = [
         {
            id: '1',
            sponsors: [{ name: 'Rockefeller' }, { name: 'Carnegie' }],
            openingHours: [
               {
                  day: 1,
                  slots: {
                     start: '10:00',
                     end: '14:00',
                  },
               },
               {
                  day: 1,
                  slots: {
                     start: '15:00',
                     end: '23:00',
                  },
               },
               {
                  day: 3,
                  slots: {
                     start: '8:00',
                     end: '20:00',
                  },
               },
            ],
         },
         {
            id: '3',
            sponsors: [{ name: 'Ford' }, { name: 'Vanderbilt' }],
            openingHours: [
               {
                  day: 1,
                  slots: {
                     start: '10:00',
                     end: '14:00',
                  },
               },
            ],
         },
         {
            id: '4',
            sponsors: [{ name: 'JP Morgan' }],
            openingHours: [],
         },
      ];
      const expected = {
         domainName: domainRequestName,
         total: results.length,
         results,
      };
      await testSpecial(input, role, domainRequestName, expected);
   });

   it('requests with other field and filter on 1 1toN field', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
         },
         filters: {
            or: [
               {
                  sponsors: {
                     name: { operator: 'contains', value: 'gan' },
                  },
               },
            ],
         },
      };
      const results = [{ name: 'D', id: '4' }];
      const expected = {
         domainName: domainRequestName,
         total: results.length,
         results,
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests with other field and filter on 2 1toN fields', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
         },
         filters: {
            or: [
               {
                  sponsors: {
                     name: { operator: 'contains', value: 'gan' },
                  },
               },
               {
                  opening_hours: {
                     day: {
                        operator: 'equals', //'greater_than',
                        value: 1,
                     },
                  },
               },
            ],
         },
      };
      const results = [
         { name: 'A', id: '1' },
         { name: 'C', id: '3' },
         { name: 'D', id: '4' },
      ];
      const expected = {
         domainName: domainRequestName,
         total: results.length,
         results,
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests with other field and filter on 2 1toN fields and AND condition', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
         },
         filters: {
            and: [
               {
                  sponsors: {
                     name: { operator: 'contains', value: 'ford' },
                  },
               },
               {
                  opening_hours: {
                     day: {
                        operator: 'equals', //'greater_than',
                        value: 1,
                     },
                  },
               },
            ],
         },
      };
      const results = [{ name: 'C', id: '3' }];
      const expected = {
         domainName: domainRequestName,
         total: results.length,
         results,
      };
      await test(input, role, domainRequestName, expected);

      // same as previous but dont use and array
      (input.filters as any) = {
         sponsors: {
            name: { operator: 'contains', value: 'ford' },
         },
         opening_hours: {
            day: {
               operator: 'equals', //'greater_than',
               value: 1,
            },
         },
      };
      await test(input, role, domainRequestName, expected);
   });
});
