import { DomainRequestName } from '../../domain-requests/types.ts';
import { test } from '../test.ts';
import { resetClient } from '../../persistence/database/dbUtils.ts';
import { afterEach, /* beforeEach, */ describe, it } from '../mod.ts';

describe('Data fetch with filters for simple ', () => {
   afterEach(async () => {
      await resetClient();
   });

   describe('filters', () => {
      describe('equals', () => {
         it('select string field and filter on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  name: true,
                  status: true,
               },
               filters: { name: { operator: 'equals', value: 'Arts' } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 1,
               results: [
                  {
                     name: 'Arts',
                     status: 'closed',
                     id: '2',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);

            input.filters.name.value = 'Art';
            const expected2 = {
               domainName: domainRequestName,
               total: 0,
               results: [],
            };
            await test(input, role, domainRequestName, expected2);
         });

         it('filter on not selected string field', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  status: true,
               },
               filters: { name: { operator: 'equals', value: 'Arts' } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 1,
               results: [
                  {
                     status: 'closed',
                     id: '2',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });

         it('select string field and filter with an array of value on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  name: true,
                  status: true,
               },
               filters: { name: { operator: 'equals', value: ['Arts', 'History'] } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 2,
               results: [
                  {
                     name: 'Arts',
                     status: 'closed',
                     id: '2',
                  },
                  {
                     name: 'History',
                     status: 'validating',
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);

            // filter equivalent to above
            (input.filters as any) = {
               or: [
                  { name: { operator: 'equals', value: 'Arts' } },
                  { name: { operator: 'equals', value: 'History' } },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });

         it('select boolean field and filter on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  name: true,
                  is_multilanguage: true,
               },
               filters: { is_multilanguage: { operator: 'equals', value: true } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 2,
               results: [
                  {
                     name: 'Math 101',
                     isMultilanguage: true,
                     id: '1',
                  },
                  {
                     name: 'History',
                     isMultilanguage: true,
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });

         it('select number field and filter on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  name: true,
                  max_seats: true,
               },
               filters: { max_seats: { operator: 'equals', value: 500 } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 1,
               results: [
                  {
                     name: 'History',
                     maxSeats: 500,
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);

            input.filters.max_seats.value = 444;
            const expected2 = {
               domainName: domainRequestName,
               total: 0,
               results: [],
            };
            await test(input, role, domainRequestName, expected2);
         });

         it('select number field and filter with an array of value on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  name: true,
                  max_seats: true,
               },
               filters: { max_seats: { operator: 'equals', value: [500, 700, 800] } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 1,
               results: [
                  {
                     name: 'History',
                     maxSeats: 500,
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });

         it('select number field (Table ID) and filter with an array of value on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  name: true,
               },
               filters: { id: { operator: 'equals', value: [1, 2, 3, 4, 5, 6, 7, 8] } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 3,
               results: [
                  {
                     name: 'Math 101',
                     id: '1',
                  },
                  {
                     name: 'Arts',
                     id: '2',
                  },
                  {
                     name: 'History',
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });

         it('select Date field and filter on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  published_date: true,
                  name: true,
               },
               filters: { published_date: { operator: 'equals', value: '2020-01-01T00:00:00.000Z' } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 1,
               results: [
                  {
                     name: 'Math 101',
                     publishedDate: '2020-01-01T00:00:00.000Z',
                     id: '1',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);

            input.filters.published_date.value = '2019-01-01T00:00:00.000Z';
            const expected2 = {
               domainName: domainRequestName,
               total: 0,
               results: [],
            };
            await test(input, role, domainRequestName, expected2);
         });

         it('select field and filter on it but value restriction', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'student';
            const input = {
               fields: { name: true, status: true },
               filters: { status: { operator: 'equals', value: 'closed' } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 2,
               results: [
                  {
                     name: 'Math 101',
                     status: 'opened',
                     id: '1',
                  },
                  {
                     name: 'History',
                     status: 'validating',
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });

         it('select other field and filter on field with value restriction', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'student';
            const input = {
               fields: { name: true },
               filters: { status: { operator: 'equals', value: 'closed' } },
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
      });

      describe('greaterThan + lesserThan', () => {
         it('select string field and filter on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  name: true,
                  status: true,
               },
               filters: {
                  and: [
                     { name: { operator: 'greater_than', value: 'a' } },
                     { name: { operator: 'lesser_than', value: 'b' } },
                  ],
               },
            };

            const expected = {
               domainName: domainRequestName,
               total: 1,
               results: [
                  {
                     name: 'Arts',
                     status: 'closed',
                     id: '2',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });
         it('select string field and filter on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'student';
            const input = {
               fields: {
                  name: true,
                  status: true,
               },
               filters: {
                  and: [
                     { name: { operator: 'greater_than', value: 'a' } },
                     { name: { operator: 'lesser_than', value: 'b' } },
                  ],
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

      describe('greaterThan', () => {
         it('select string field and filter on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  name: true,
                  status: true,
               },
               filters: { name: { operator: 'greater_than', value: 'Arts' } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 2,
               results: [
                  {
                     name: 'Math 101',
                     status: 'opened',
                     id: '1',
                  },
                  {
                     name: 'History',
                     status: 'validating',
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);

            input.filters.name.operator = 'greater_than_or_equals';
            const expected2 = {
               domainName: domainRequestName,
               total: 3,
               results: [
                  {
                     name: 'Math 101',
                     status: 'opened',
                     id: '1',
                  },
                  {
                     name: 'Arts',
                     status: 'closed',
                     id: '2',
                  },
                  {
                     name: 'History',
                     status: 'validating',
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected2);
         });

         it('filter on not selected string field', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  status: true,
               },
               filters: { name: { operator: 'greater_than', value: 'Arts' } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 2,
               results: [
                  {
                     status: 'opened',
                     id: '1',
                  },
                  {
                     status: 'validating',
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);

            input.filters.name.operator = 'greater_than_or_equals';
            const expected2 = {
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
            await test(input, role, domainRequestName, expected2);
         });

         it('N/A select boolean field and filter on it', async () => {});

         it('select number field and filter on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  name: true,
                  max_seats: true,
               },
               filters: { max_seats: { operator: 'greater_than', value: 400 } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 1,
               results: [
                  {
                     name: 'History',
                     maxSeats: 500,
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);

            input.filters.max_seats.operator = 'greater_than_or_equals';
            const expected2 = {
               domainName: domainRequestName,
               total: 2,
               results: [
                  {
                     name: 'Arts',
                     maxSeats: 400,
                     id: '2',
                  },
                  {
                     name: 'History',
                     maxSeats: 500,
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected2);
         });

         it('select Date field and filter on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  published_date: true,
                  name: true,
               },
               filters: { published_date: { operator: 'greater_than', value: '2020-02-01T00:00:00.000Z' } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 1,
               results: [
                  {
                     name: 'History',
                     publishedDate: '2020-03-01T00:00:00.000Z',
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);

            input.filters.published_date.operator = 'greater_than_or_equals';
            const expected2 = {
               domainName: domainRequestName,
               total: 2,
               results: [
                  {
                     name: 'Arts',
                     publishedDate: '2020-02-01T00:00:00.000Z',
                     id: '2',
                  },
                  {
                     name: 'History',
                     publishedDate: '2020-03-01T00:00:00.000Z',
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected2);
         });
      });

      describe('lesserThan', () => {
         it('select string field and filter on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  name: true,
                  status: true,
               },
               filters: { name: { operator: 'lesser_than', value: 'Arts' } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 0,
               results: [],
            };
            await test(input, role, domainRequestName, expected);

            input.filters.name.operator = 'lesser_than_or_equals';
            const expected2 = {
               domainName: domainRequestName,
               total: 1,
               results: [
                  {
                     name: 'Arts',
                     status: 'closed',
                     id: '2',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected2);
         });

         it('filter on not selected string field', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  status: true,
               },
               filters: { name: { operator: 'lesser_than', value: 'Arts' } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 0,
               results: [],
            };
            await test(input, role, domainRequestName, expected);

            input.filters.name.operator = 'lesser_than_or_equals';
            const expected2 = {
               domainName: domainRequestName,
               total: 1,
               results: [
                  {
                     status: 'closed',
                     id: '2',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected2);
         });

         it('N/A select boolean field and filter on it', async () => {});

         it('select number field and filter on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  name: true,
                  max_seats: true,
               },
               filters: { max_seats: { operator: 'lesser_than', value: 400 } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 1,
               results: [
                  {
                     name: 'Math 101',
                     maxSeats: 200,
                     id: '1',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);

            input.filters.max_seats.operator = 'lesser_than_or_equals';
            const expected2 = {
               domainName: domainRequestName,
               total: 2,
               results: [
                  {
                     name: 'Math 101',
                     maxSeats: 200,
                     id: '1',
                  },
                  {
                     name: 'Arts',
                     maxSeats: 400,
                     id: '2',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected2);
         });

         it('select Date field and filter on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  published_date: true,
                  name: true,
               },
               filters: { published_date: { operator: 'lesser_than', value: '2020-02-01T00:00:00.000Z' } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 1,
               results: [
                  {
                     name: 'Math 101',
                     publishedDate: '2020-01-01T00:00:00.000Z',
                     id: '1',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);

            input.filters.published_date.operator = 'lesser_than_or_equals';
            const expected2 = {
               domainName: domainRequestName,
               total: 2,
               results: [
                  {
                     name: 'Math 101',
                     publishedDate: '2020-01-01T00:00:00.000Z',
                     id: '1',
                  },
                  {
                     name: 'Arts',
                     publishedDate: '2020-02-01T00:00:00.000Z',
                     id: '2',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected2);
         });
      });

      describe('between', () => {
         it('select string field and filter on an array of values on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  name: true,
                  status: true,
               },
               filters: {
                  name: { operator: 'between', value: ['d', 'Z'] },
               },
            };

            const expected = {
               domainName: domainRequestName,
               total: 2,
               results: [
                  {
                     name: 'Math 101',
                     status: 'opened',
                     id: '1',
                  },
                  {
                     name: 'History',
                     status: 'validating',
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });

         it('filter on not selected string field N/A', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  status: true,
               },
               filters: {
                  name: { operator: 'between', value: ['d', 'Z'] },
               },
            };

            const expected = {
               domainName: domainRequestName,
               total: 2,
               results: [
                  {
                     status: 'opened',
                     id: '1',
                  },
                  {
                     status: 'validating',
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });

         it('N/A select boolean field and filter on it', async () => {});

         it('select number field and filter on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  name: true,
                  max_seats: true,
               },
               filters: { max_seats: { operator: 'between', value: [300, 600] } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 2,
               results: [
                  {
                     name: 'Arts',
                     maxSeats: 400,
                     id: '2',
                  },
                  {
                     name: 'History',
                     maxSeats: 500,
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });

         it('select Date field and filter on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  published_date: true,
                  name: true,
               },
               filters: {
                  published_date: {
                     operator: 'between',
                     value: ['2020-02-01T00:00:00.000Z', '2020-03-01T00:00:00.000Z'],
                  },
               },
            };

            const expected = {
               domainName: domainRequestName,
               total: 2,
               results: [
                  {
                     name: 'Arts',
                     publishedDate: '2020-02-01T00:00:00.000Z',
                     id: '2',
                  },
                  {
                     name: 'History',
                     publishedDate: '2020-03-01T00:00:00.000Z',
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });
      });

      describe('contains', () => {
         it('select string field and filter on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  name: true,
                  status: true,
               },
               filters: { name: { operator: 'contains', value: 'rt' } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 1,
               results: [
                  {
                     name: 'Arts',
                     status: 'closed',
                     id: '2',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);

            input.filters.name.value = 't';
            const expected2 = {
               domainName: domainRequestName,
               total: 3,
               results: [
                  {
                     name: 'Math 101',
                     status: 'opened',
                     id: '1',
                  },
                  {
                     name: 'Arts',
                     status: 'closed',
                     id: '2',
                  },
                  {
                     name: 'History',
                     status: 'validating',
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected2);
         });

         it('filter on not selected string field', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  status: true,
               },
               filters: { name: { operator: 'contains', value: 'rts' } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 1,
               results: [
                  {
                     status: 'closed',
                     id: '2',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });

         it('select string field and filter with a range on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  name: true,
                  status: true,
               },
               filters: { name: { operator: 'contains', value: ['rt', 'tor'] } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 2,
               results: [
                  {
                     name: 'Arts',
                     status: 'closed',
                     id: '2',
                  },
                  {
                     name: 'History',
                     status: 'validating',
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });

         it('N/A select boolean field and filter on it', async () => {});

         it('select number field and filter on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  name: true,
                  max_seats: true,
               },
               filters: { max_seats: { operator: 'contains', value: 5 } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 1,
               results: [
                  {
                     name: 'History',
                     maxSeats: 500,
                     id: '3',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);

            input.filters.max_seats.value = 444;
            const expected2 = {
               domainName: domainRequestName,
               total: 0,
               results: [],
            };
            await test(input, role, domainRequestName, expected2);
         });

         it('select Date field and filter on it', async () => {
            const domainRequestName: DomainRequestName = 'course';
            const role = 'admin';
            const input = {
               fields: {
                  published_date: true,
                  name: true,
               },
               filters: { published_date: { operator: 'contains', value: '2020-01-01T00:00:00.000Z' } },
            };

            const expected = {
               domainName: domainRequestName,
               total: 1,
               results: [
                  {
                     name: 'Math 101',
                     publishedDate: '2020-01-01T00:00:00.000Z',
                     id: '1',
                  },
               ],
            };
            await test(input, role, domainRequestName, expected);
         });
      });
   });

   // describe('filters misuse', () => {
   //    // on bool use string
   //    // on string use bool or number
   //
   //    it('select boolean field and filter on it but restriction on other field', async () => {
   //       const domainRequestName: DomainRequestName = 'course';
   //       const role = 'student';
   //       const input = {
   //          fields: {
   //             name: true,
   //             is_multilanguage: true,
   //          },
   //          filters: { is_multilanguage: { operator: 'equals', value: false } },
   //       };

   //       const expected = {
   //          domainName: domainRequestName,
   //          total: 0,
   //          results: [],
   //       };
   //       await test(input, role, domainRequestName, expected);
   //    });
   // });

   // TODO misuse
   // => type: {name: { operator: 'contains', value: ['e'] }}, // array must have 2 values
   // => typ: {name: { operator: 'contains', value: ['e'] }}, // unknown
   // => type: {nam: { operator: 'contains', value: ['e'] }}, // unknown
});
