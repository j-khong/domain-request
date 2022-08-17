import { DomainRequestName } from '../../domain-requests/types.ts';
import { test } from '../test.ts';
import { resetClient } from '../../persistence/database/dbUtils.ts';
import { afterEach, /* beforeEach, */ describe, it } from '../mod.ts';

describe('Data fetch with extended fields', () => {
   afterEach(async () => {
      await resetClient();
   });

   it('fetch some fields + all fields of one extended', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'student';
      const input = {
         fields: {
            name: true,
            status: true,
            opening_hours: { fields: { day: true, slots: { fields: { start: true, end: true } } } },
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 3,
         results: [
            {
               name: 'A',
               status: 'opened',
               id: '1',
               openingHours: [
                  {
                     day: 1,
                     slots: [
                        {
                           start: '10:00',
                           end: '14:00',
                        },
                        {
                           start: '15:00',
                           end: '23:00',
                        },
                     ],
                  },
                  {
                     day: 3,
                     slots: [
                        {
                           start: '8:00',
                           end: '20:00',
                        },
                     ],
                  },
               ],
            },
            {
               name: 'C',
               status: 'opened',
               id: '3',
               openingHours: [
                  {
                     day: 1,
                     slots: [
                        {
                           start: '10:00',
                           end: '14:00',
                        },
                     ],
                  },
               ],
            },
            {
               name: 'D',
               status: 'work in progress',
               id: '4',
               openingHours: [
                  {
                     day: null,
                     slots: [
                        {
                           start: null,
                           end: null,
                        },
                     ],
                  },
               ],
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('fetch some fields + some fields of one extended', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'student';
      const input = {
         fields: {
            name: true,
            status: true,
            opening_hours: { fields: { day: true, slots: { fields: { start: true } } } },
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 3,
         results: [
            {
               name: 'A',
               status: 'opened',
               id: '1',
               openingHours: [
                  {
                     day: 1,
                     slots: [
                        {
                           start: '10:00',
                        },
                        {
                           start: '15:00',
                        },
                     ],
                  },
                  {
                     day: 3,
                     slots: [
                        {
                           start: '8:00',
                        },
                     ],
                  },
               ],
            },
            {
               name: 'C',
               status: 'opened',
               id: '3',
               openingHours: [
                  {
                     day: 1,
                     slots: [
                        {
                           start: '10:00',
                        },
                     ],
                  },
               ],
            },
            {
               name: 'D',
               status: 'work in progress',
               id: '4',
               openingHours: [
                  {
                     day: null,
                     slots: [
                        {
                           start: null,
                        },
                     ],
                  },
               ],
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('fetch some fields + one field of one extended', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'student';
      const input = {
         fields: {
            name: true,
            status: true,
            opening_hours: { fields: { day: true } },
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 3,
         results: [
            {
               name: 'A',
               status: 'opened',
               id: '1',
               openingHours: [
                  {
                     day: 1,
                  },
                  {
                     day: 3,
                  },
               ],
            },
            {
               name: 'C',
               status: 'opened',
               id: '3',
               openingHours: [
                  {
                     day: 1,
                  },
               ],
            },
            {
               name: 'D',
               status: 'work in progress',
               id: '4',
               openingHours: [
                  {
                     day: null,
                  },
               ],
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('fetch one extended field only', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'student';
      const input = {
         fields: { opening_hours: { fields: { day: true } } },
      };

      const expected = {
         domainName: 'building',
         total: 3,
         results: [
            {
               id: '1',
               openingHours: [
                  {
                     day: 1,
                  },
                  {
                     day: 3,
                  },
               ],
            },
            {
               id: '3',
               openingHours: [
                  {
                     day: 1,
                  },
               ],
            },
            {
               id: '4',
               openingHours: [
                  {
                     day: null,
                  },
               ],
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });
});
