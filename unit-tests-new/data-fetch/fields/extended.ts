import { DomainRequestName } from '../../domain-requests/types.ts';
import { test } from '../test.ts';
import { resetClient } from '../../persistence/database/dbUtils.ts';
import { afterEach, /* beforeEach, */ describe, it } from '../mod.ts';

describe('Data fetch with one to one fields', () => {
   afterEach(async () => {
      await resetClient();
   });

   it('requests with 1 1to1 field (1 value)', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            type: { name: true },
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
            {
               type: {
                  name: 'Colonial',
               },
               id: '4',
            },
            {
               type: {
                  name: 'New Age',
               },
               id: '3',
            },
            {
               type: {
                  name: 'Rococco',
               },
               id: '2',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests with 1 1to1 field (2 values)', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            architect: {
               id: true,
               name: true,
            },
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 4,
         results: [
            {
               architect: {
                  id: '1',
                  name: 'Roberto',
               },
               id: '1',
            },
            {
               architect: {
                  id: '2',
                  name: 'Ricardo',
               },
               id: '2',
            },
            {
               architect: {
                  id: '3',
                  name: 'Rodrigo',
               },
               id: '4',
            },
            {
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

   it('requests with 2 1to1 fields (1 & 2 values)', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            type: { name: true },
            architect: {
               id: true,
               name: true,
            },
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
               architect: {
                  id: '1',
                  name: 'Roberto',
               },
               id: '1',
            },
            {
               type: {
                  name: 'Rococco',
               },
               architect: {
                  id: '2',
                  name: 'Ricardo',
               },
               id: '2',
            },
            {
               type: {
                  name: 'New Age',
               },
               architect: {
                  id: '4',
                  name: 'Armando',
               },
               id: '3',
            },
            {
               type: {
                  name: 'Colonial',
               },
               architect: {
                  id: '3',
                  name: 'Rodrigo',
               },
               id: '4',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests with 1 1to1 field (2 levels)', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            architect: {
               name: true,
               rating: { rate: true },
            },
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 4,
         results: [
            {
               architect: {
                  name: 'Roberto',
                  rating: {
                     rate: 'A',
                  },
               },
               id: '1',
            },
            {
               architect: {
                  name: 'Ricardo',
                  rating: {
                     rate: 'C',
                  },
               },
               id: '2',
            },
            {
               architect: {
                  name: 'Rodrigo',
                  rating: {
                     rate: 'A',
                  },
               },
               id: '4',
            },
            {
               architect: {
                  name: 'Armando',
                  rating: {
                     rate: 'B',
                  },
               },
               id: '3',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests with 1 1to1 field (3 levels)', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            architect: {
               name: true,
               rating: { rate: true, rater: { name: true } },
            },
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 4,
         results: [
            {
               architect: {
                  name: 'Roberto',
                  rating: {
                     rate: 'A',
                     rater: {
                        name: 'S&P',
                     },
                  },
               },
               id: '1',
            },
            {
               architect: {
                  name: 'Ricardo',
                  rating: {
                     rate: 'C',
                     rater: {
                        name: 'Fitch',
                     },
                  },
               },
               id: '2',
            },
            {
               architect: {
                  name: 'Rodrigo',
                  rating: {
                     rate: 'A',
                     rater: {
                        name: 'Fitch',
                     },
                  },
               },
               id: '4',
            },
            {
               architect: {
                  name: 'Armando',
                  rating: {
                     rate: 'B',
                     rater: {
                        name: 'Moodys',
                     },
                  },
               },
               id: '3',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });
   //    const domainRequestName: DomainRequestName = 'building';
   //    const role = 'student';
   //    const input = {
   //       fields: {
   //          name: true,
   //          status: true,
   //          opening_hours: { fields: { day: true, slots: { fields: { start: true } } } },
   //       },
   //    };
   //    const expected = {
   //       domainName: domainRequestName,
   //       total: 3,
   //       results: [
   //          {
   //             name: 'A',
   //             status: 'opened',
   //             id: '1',
   //             openingHours: [
   //                {
   //                   day: 1,
   //                   slots: [
   //                      {
   //                         start: '10:00',
   //                      },
   //                      {
   //                         start: '15:00',
   //                      },
   //                   ],
   //                },
   //                {
   //                   day: 3,
   //                   slots: [
   //                      {
   //                         start: '8:00',
   //                      },
   //                   ],
   //                },
   //             ],
   //          },
   //          {
   //             name: 'C',
   //             status: 'opened',
   //             id: '3',
   //             openingHours: [
   //                {
   //                   day: 1,
   //                   slots: [
   //                      {
   //                         start: '10:00',
   //                      },
   //                   ],
   //                },
   //             ],
   //          },
   //          {
   //             name: 'D',
   //             status: 'work in progress',
   //             id: '4',
   //             openingHours: [
   //                {
   //                   day: null,
   //                   slots: [
   //                      {
   //                         start: null,
   //                      },
   //                   ],
   //                },
   //             ],
   //          },
   //       ],
   //    };
   //    await test(input, role, domainRequestName, expected);
   // });

   // it('fetch some fields + one field of one extended', async () => {
   //    const domainRequestName: DomainRequestName = 'building';
   //    const role = 'student';
   //    const input = {
   //       fields: {
   //          name: true,
   //          status: true,
   //          opening_hours: { fields: { day: true } },
   //       },
   //    };
   //    const expected = {
   //       domainName: domainRequestName,
   //       total: 3,
   //       results: [
   //          {
   //             name: 'A',
   //             status: 'opened',
   //             id: '1',
   //             openingHours: [
   //                {
   //                   day: 1,
   //                },
   //                {
   //                   day: 3,
   //                },
   //             ],
   //          },
   //          {
   //             name: 'C',
   //             status: 'opened',
   //             id: '3',
   //             openingHours: [
   //                {
   //                   day: 1,
   //                },
   //             ],
   //          },
   //          {
   //             name: 'D',
   //             status: 'work in progress',
   //             id: '4',
   //             openingHours: [
   //                {
   //                   day: null,
   //                },
   //             ],
   //          },
   //       ],
   //    };
   //    await test(input, role, domainRequestName, expected);
   // });

   // it('fetch one extended field only', async () => {
   //    const domainRequestName: DomainRequestName = 'building';
   //    const role = 'student';
   //    const input = {
   //       fields: { opening_hours: { fields: { day: true } } },
   //    };

   //    const expected = {
   //       domainName: 'building',
   //       total: 3,
   //       results: [
   //          {
   //             id: '1',
   //             openingHours: [
   //                {
   //                   day: 1,
   //                },
   //                {
   //                   day: 3,
   //                },
   //             ],
   //          },
   //          {
   //             id: '3',
   //             openingHours: [
   //                {
   //                   day: 1,
   //                },
   //             ],
   //          },
   //          {
   //             id: '4',
   //             openingHours: [
   //                {
   //                   day: null,
   //                },
   //             ],
   //          },
   //       ],
   //    };
   //    await test(input, role, domainRequestName, expected);
   // });
});
