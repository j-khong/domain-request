import { DomainRequestName } from '../../domain-requests/types.ts';
import { test } from '../test.ts';
import { resetClient } from '../../persistence/database/dbUtils.ts';
import { afterEach, /* beforeEach, */ describe, it } from '../mod.ts';

describe('Data fetch for simple', () => {
   afterEach(async () => {
      await resetClient();
   });

   describe('fields', () => {
      it('requests one field', async () => {
         const domainRequestName: DomainRequestName = 'course';
         const role = 'student';
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
                  name: 'Math 101',
                  id: '1',
               },
               {
                  name: 'History',
                  id: '3',
               },
            ],
         };
         await test(input, role, domainRequestName, expected);
      });

      it('requests all authorized fields', async () => {
         const domainRequestName: DomainRequestName = 'course';
         const role = 'student';
         const input = {
            fields: {
               name: true,
               published_date: true,
               is_multilanguage: true,
               status: true,
            },
         };

         const expected = {
            domainName: domainRequestName,
            total: 2,
            results: [
               {
                  name: 'Math 101',
                  publishedDate: new Date('2020-01-01T00:00:00.000Z'),
                  isMultilanguage: 1,
                  status: 'opened',
                  id: '1',
               },
               {
                  name: 'History',
                  publishedDate: new Date('2020-03-01T00:00:00.000Z'),
                  isMultilanguage: 1,
                  status: 'validating',
                  id: '3',
               },
            ],
         };
         await test(input, role, domainRequestName, expected);
      });

      it('requests all fields with unauthorized', async () => {
         const domainRequestName: DomainRequestName = 'course';
         const role = 'student';
         const input = {
            fields: {
               name: true,
               published_date: true,
               is_multilanguage: true,
               max_seats: true,
               status: true,
            },
         };

         const expected = {
            domainName: domainRequestName,
            total: 2,
            results: [
               {
                  name: 'Math 101',
                  publishedDate: new Date('2020-01-01T00:00:00.000Z'),
                  isMultilanguage: 1,
                  status: 'opened',
                  id: '1',
               },
               {
                  name: 'History',
                  publishedDate: new Date('2020-03-01T00:00:00.000Z'),
                  isMultilanguage: 1,
                  status: 'validating',
                  id: '3',
               },
            ],
         };
         await test(input, role, domainRequestName, expected);
      });

      it('requests unauthorized field', async () => {
         const domainRequestName: DomainRequestName = 'course';
         const role = 'student';
         const input = {
            fields: {
               max_seats: true,
            },
         };

         const expected = {
            domainName: domainRequestName,
            total: 0,
            results: [],
         };
         await test(input, role, domainRequestName, expected);
      });

      it('requests field with name mapping', async () => {
         const domainRequestName: DomainRequestName = 'course';
         const role = 'admin';
         const input = {
            fields: {
               max_seats: true,
            },
         };

         const expected = {
            domainName: domainRequestName,
            total: 3,
            results: [
               {
                  maxSeats: 200,
                  id: '1',
               },
               {
                  maxSeats: 400,
                  id: '2',
               },
               {
                  maxSeats: 500,
                  id: '3',
               },
            ],
         };
         await test(input, role, domainRequestName, expected);
      });
   });

   describe('fields misuse', () => {
      it('unexisting field', async () => {
         const domainRequestName: DomainRequestName = 'course';
         const role = 'admin';
         const input = {
            fields: {
               seats_max: true,
            },
         };

         const expected = {
            domainName: domainRequestName,
            total: 0,
            results: [],
         };
         await test(input, role, domainRequestName, expected);
      });

      it('unexisting + existing fields', async () => {
         const domainRequestName: DomainRequestName = 'course';
         const role = 'admin';
         const input = {
            fields: {
               name: true,
               seats_max: true,
            },
         };

         const expected = {
            domainName: domainRequestName,
            total: 3,
            results: [
               {
                  name: 'Arts',
                  id: '2',
               },
               {
                  name: 'History',
                  id: '3',
               },
               {
                  name: 'Math 101',
                  id: '1',
               },
            ],
         };
         await test(input, role, domainRequestName, expected);
      });

      it('requests existing fields with filter isIn on non natural key', async () => {
         const domainRequestName: DomainRequestName = 'country';
         const role = 'student';
         const input = {
            fields: {
               name: true,
               timezone: true,
            },
            filters: { name: { operator: 'is_in', value: '3,1' } },
            options: {},
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
               {
                  name: 'espagne',
                  timezone: 'Europe/Madrid',
                  id: '2',
               },
            ],
         };
         await test(input, role, domainRequestName, expected);
      });

      it('requests existing fields with filter isIn with invalid values', async () => {
         const domainRequestName: DomainRequestName = 'country';
         const role = 'student';
         const input = {
            fields: {
               name: true,
               timezone: true,
            },
            filters: { id: { operator: 'is_in', value: '3   ,undefined, null  , ,  "   "  , 1,   "" ' } },
            options: {},
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
               {
                  name: 'espagne',
                  timezone: 'Europe/Madrid',
                  id: '2',
               },
            ],
         };
         await test(input, role, domainRequestName, expected);
      });
   });
});
