import { DomainRequestName } from '../../domain-requests2/types.ts';
import { test } from '../test.ts';
import { resetClient } from '../../persistence/database/dbUtils.ts';
import { afterEach, /* beforeEach, */ describe, it } from '../mod.ts';

describe('Data fetch for simple', () => {
   afterEach(async () => {
      await resetClient();
   });

   describe('fields', () => {
      describe('full access role', () => {
         it('requests with no fields', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {},
            };
            const expected = {
               domainName: domainRequestName,
               total: 3,
               results: [
                  {
                     id: '2',
                  },
                  {
                     id: '3',
                  },
                  {
                     id: '1',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });
         it('requests with 1 field (natural key)', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: { id: true },
            };
            const expected = {
               domainName: domainRequestName,
               total: 3,
               results: [
                  {
                     id: '2',
                  },
                  {
                     id: '3',
                  },
                  {
                     id: '1',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });
         it('requests with 1 field (string)', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: { name: true },
            };
            const expected = {
               domainName: domainRequestName,
               total: 3,
               results: [
                  {
                     id: '2',
                     name: 'Arts',
                  },
                  {
                     id: '3',
                     name: 'History',
                  },
                  {
                     id: '1',
                     name: 'Math 101',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });
         it('requests with 1 field (number)', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: { max_seats: true },
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
         it('requests with 1 field (iso date)', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: { published_date: true },
            };
            const expected = {
               domainName: domainRequestName,
               total: 3,
               results: [
                  {
                     publishedDate: '2020-01-01T00:00:00.000Z',
                     id: '1',
                  },
                  {
                     publishedDate: '2020-02-01T00:00:00.000Z',
                     id: '2',
                  },
                  {
                     publishedDate: '2020-03-01T00:00:00.000Z',
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });
         it('requests with 1 field (boolean)', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: { is_multilanguage: true },
            };
            const expected = {
               domainName: domainRequestName,
               total: 3,
               results: [
                  {
                     isMultilanguage: true,
                     id: '1',
                  },
                  {
                     isMultilanguage: false,
                     id: '2',
                  },
                  {
                     isMultilanguage: true,
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });
         it('requests with 1 field (custom)', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: { status: true },
            };
            const expected = {
               domainName: domainRequestName,
               total: 3,
               results: [
                  {
                     status: 'opened',
                     id: '1',
                  },
                  {
                     status: 'closed',
                     id: '2',
                  },
                  {
                     status: 'validating',
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });
         it('requests with 1 restricted field', async () => {
            const domainRequestName: DomainRequestName = 'building';
            const role = 'admin';
            const input = {
               fields: { private_field: true },
            };
            const expected = {
               domainName: domainRequestName,
               total: 4,
               results: [
                  {
                     privateField: 'confidential data',
                     id: '1',
                  },
                  {
                     privateField: 'confidential data',
                     id: '2',
                  },
                  {
                     privateField: 'confidential data',
                     id: '3',
                  },
                  {
                     privateField: 'confidential data',
                     id: '4',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });
         it('requests with 1 all fields restricted domain', async () => {
            const domainRequestName: DomainRequestName = 'studentCategory';
            const role = 'admin';
            const input = {
               fields: { name: true, other_data: true },
            };
            const expected = {
               domainName: domainRequestName,
               total: 2,
               results: [
                  {
                     name: 'Arts',
                     otherData: 'other_data',
                     id: '1',
                  },
                  {
                     name: 'Sports',
                     otherData: 'other_data',
                     id: '2',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });
         it('requests with 2 fields', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: { id: true, name: true },
            };
            const expected = {
               domainName: domainRequestName,
               total: 3,
               results: [
                  {
                     id: '2',
                     name: 'Arts',
                  },
                  {
                     id: '3',
                     name: 'History',
                  },
                  {
                     id: '1',
                     name: 'Math 101',
                  },
               ],
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
      describe('fields restricted access role', () => {
         it('requests with 1 restricted field', async () => {
            const domainRequestName: DomainRequestName = 'building';
            const role = 'student';
            const input = {
               fields: { private_field: true },
            };
            const expected = {
               domainName: domainRequestName,
               total: 3,
               results: [
                  {
                     id: '1',
                  },
                  {
                     id: '3',
                  },
                  {
                     id: '4',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });
         it('requests with 1 all fields restricted domain', async () => {
            const domainRequestName: DomainRequestName = 'studentCategory';
            const role = 'student';
            const input = {
               fields: { name: true, other_data: true },
            };
            const expected = {
               domainName: domainRequestName,
               total: 2,
               results: [
                  {
                     id: '1',
                  },
                  {
                     id: '2',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });
         it('requests one field with user restriction', async () => {
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
                     publishedDate: '2020-01-01T00:00:00.000Z',
                     isMultilanguage: true,
                     status: 'opened',
                     id: '1',
                  },
                  {
                     name: 'History',
                     publishedDate: '2020-03-01T00:00:00.000Z',
                     isMultilanguage: true,
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
                     publishedDate: '2020-01-01T00:00:00.000Z',
                     isMultilanguage: true,
                     status: 'opened',
                     id: '1',
                  },
                  {
                     name: 'History',
                     publishedDate: '2020-03-01T00:00:00.000Z',
                     isMultilanguage: true,
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
               total: 2,
               results: [
                  {
                     id: '1',
                  },
                  {
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });
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
            total: 3,
            results: [
               {
                  id: '2',
               },
               {
                  id: '3',
               },
               {
                  id: '1',
               },
            ],
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
      // TODO reactivate
      //
      // it('requests existing fields with filter isIn on non natural key', async () => {
      //    const domainRequestName: DomainRequestName = 'country';
      //    const role = 'student';
      //    const input = {
      //       fields: {
      //          name: true,
      //          timezone: true,
      //       },
      //       filters: { name: { operator: 'is_in', value: '3,1' } },
      //       options: {},
      //    };

      //    const expected = {
      //       domainName: domainRequestName,
      //       total: 2,
      //       results: [
      //          {
      //             name: 'france',
      //             timezone: 'Europe/Paris',
      //             id: '1',
      //          },
      //          {
      //             name: 'espagne',
      //             timezone: 'Europe/Madrid',
      //             id: '2',
      //          },@
      //       ],
      //    };
      //    await test(input, role, domainRequestName, expected);
      // });

      // it('requests existing fields with filter isIn with invalid values', async () => {
      //    const domainRequestName: DomainRequestName = 'country';
      //    const role = 'student';
      //    const input = {
      //       fields: {
      //          name: true,
      //          timezone: true,
      //       },
      //       filters: { id: { operator: 'is_in', value: '3   ,undefined, null  , ,  "   "  , 1,   "" ' } },
      //       options: {},
      //    };

      //    const expected = {
      //       domainName: domainRequestName,
      //       total: 2,
      //       results: [
      //          {
      //             name: 'france',
      //             timezone: 'Europe/Paris',
      //             id: '1',
      //          },
      //          {
      //             name: 'espagne',
      //             timezone: 'Europe/Madrid',
      //             id: '2',
      //          },
      //       ],
      //    };
      //    await test(input, role, domainRequestName, expected);
      // });
   });
});
