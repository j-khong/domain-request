import 'mocha';
import { expect } from 'chai';

import { getDomainRequestHandler } from '../domains/init';
import { DomainRequestName, Role } from '../domains/types';

describe('Data fetch for simple ', () => {
   describe('fields', () => {
      it('requests existing fields', function (done) {
         const domainRequestName: DomainRequestName = 'country';
         const role = 'student';
         let input = {
            fields: {
               name: true,
               timezone: true,
            },
            filters: {},
         };

         const expected = {
            domainName: 'country',
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
         test(input, role, domainRequestName, expected)
            .then(() => {
               // should have same result with a trivial filter
               (input.filters as any).id = {
                  operator: 'greater_than',
                  value: '0',
               };
               test(input, role, domainRequestName, expected).then(done).catch(done);
            })
            .catch(done);
      });
      it('requests existing fields with limit and order by desc', function (done) {
         const domainRequestName: DomainRequestName = 'country';
         const role = 'student';
         let input = {
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
            domainName: 'country',
            total: 2,
            results: [
               {
                  name: 'espagne',
                  timezone: 'Europe/Madrid',
                  id: '2',
               },
            ],
         };
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
      it('requests existing fields with limit and order by asc', function (done) {
         const domainRequestName: DomainRequestName = 'country';
         const role = 'student';
         let input = {
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
            domainName: 'country',
            total: 2,
            results: [
               {
                  name: 'france',
                  timezone: 'Europe/Paris',
                  id: '1',
               },
            ],
         };
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
      it('requests existing fields with filter equals', function (done) {
         const domainRequestName: DomainRequestName = 'country';
         const role = 'student';
         let input = {
            fields: {
               name: true,
               timezone: true,
            },
            filters: { name: { operator: 'equals', value: 'France' } },
            options: {
               orderby: 'id desc',
            },
         };

         const expected = {
            domainName: 'country',
            total: 1,
            results: [
               {
                  name: 'france',
                  timezone: 'Europe/Paris',
                  id: '1',
               },
            ],
         };
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
      it('requests existing fields with filter contains', function (done) {
         const domainRequestName: DomainRequestName = 'country';
         const role = 'student';
         let input = {
            fields: {
               name: true,
               timezone: true,
            },
            filters: { name: { operator: 'contains', value: 'anc' } },
            options: {},
         };

         const expected = {
            domainName: 'country',
            total: 1,
            results: [
               {
                  name: 'france',
                  timezone: 'Europe/Paris',
                  id: '1',
               },
            ],
         };
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
      it('requests existing fields with filter isIn', function (done) {
         const domainRequestName: DomainRequestName = 'country';
         const role = 'student';
         let input = {
            fields: {
               name: true,
               timezone: true,
            },
            filters: { id: { operator: 'is_in', value: '3,1' } },
            options: {},
         };

         const expected = {
            domainName: 'country',
            total: 1,
            results: [
               {
                  name: 'france',
                  timezone: 'Europe/Paris',
                  id: '1',
               },
            ],
         };
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
      //   it('requests 1 existing field', function (done) {
      //      const domainRequestName: DomainRequestName = 'building';
      //      const role = 'student';
      //      let input = {
      //         fields: {
      //            name: true,
      //            status: true,
      //            opening_hours: { fields: { day: true, slots: { fields: { start: true } } } },
      //         },
      //         filters: {
      //            or: [
      //               {
      //                  name: {
      //                     operator: 'equals',
      //                     value: 'A',
      //                  },
      //               },
      //               {
      //                  name: {
      //                     operator: 'equals',
      //                     value: 'B',
      //                  },
      //               },
      //            ],
      //         },
      //         options: {
      //            orderby: 'id desc',
      //         },
      //      };

      //      const expected = {
      //         domainName: 'building',
      //         total: 1,
      //         results: [
      //            {
      //               name: 'A',
      //               status: 'opened',
      //               id: '1',
      //               openingHours: [
      //                  {
      //                     day: 1,
      //                     slots: [
      //                        {
      //                           start: '10:00',
      //                        },
      //                        {
      //                           start: '15:00',
      //                        },
      //                     ],
      //                  },
      //                  {
      //                     day: 3,
      //                     slots: [
      //                        {
      //                           start: '8:00',
      //                        },
      //                     ],
      //                  },
      //               ],
      //            },
      //         ],
      //      };
      //      test(input, role, domainRequestName, expected)
      //         .then(() => {
      //            // should have same result with a trivial filter
      //            (input.filters as any).id = {
      //               operator: 'greater_than',
      //               value: '0',
      //            };
      //            test(input, role, domainRequestName, expected).then(done).catch(done);
      //         })
      //         .catch(done);
      //   });
      //   it('requests 1 existing field', function (done) {
      //      const domainRequestName: DomainRequestName = 'building';
      //      const role = 'student';
      //      let input = {
      //         fields: { name: true, status: true, opening_hours: { fields: { day: true } } },
      //         filters: {
      //            or: [
      //               {
      //                  name: {
      //                     operator: 'equals',
      //                     value: 'A',
      //                  },
      //               },
      //               {
      //                  name: {
      //                     operator: 'equals',
      //                     value: 'B',
      //                  },
      //               },
      //            ],
      //         },
      //         options: {
      //            orderby: 'id desc',
      //         },
      //      };

      //      const expected = {
      //         domainName: 'building',
      //         total: 1,
      //         results: [
      //            {
      //               name: 'A',
      //               status: 'opened',
      //               id: '1',
      //               openingHours: [
      //                  {
      //                     day: 1,
      //                  },
      //                  {
      //                     day: 3,
      //                  },
      //               ],
      //            },
      //         ],
      //      };
      //      test(input, role, domainRequestName, expected)
      //         .then(() => {
      //            // should have same result with a trivial filter
      //            (input.filters as any).id = {
      //               operator: 'greater_than',
      //               value: '0',
      //            };
      //            test(input, role, domainRequestName, expected).then(done).catch(done);
      //         })
      //         .catch(done);
      //   });
      //   it('requests 1 existing field', function (done) {
      //      const domainRequestName: DomainRequestName = 'building';
      //      const role = 'student';
      //      let input = {
      //         fields: { name: true, status: true },
      //         filters: {
      //            and: [
      //               {
      //                  name: {
      //                     operator: 'equals',
      //                     value: 'A',
      //                  },
      //               },
      //               {
      //                  name: {
      //                     operator: 'equals',
      //                     value: 'B',
      //                  },
      //               },
      //            ],
      //         },
      //         options: {
      //            orderby: 'id desc',
      //         },
      //      };

      //      const expected = {
      //         domainName: 'building',
      //         total: 0,
      //         results: [],
      //      };
      //      test(input, role, domainRequestName, expected).then(done).catch(done);
      //   });
      //   it('get restricted data', function (done) {
      //      const domainRequestName: DomainRequestName = 'building';
      //      const role = 'student';
      //      let input = {
      //         fields: { name: true, status: true },
      //      };

      //      const expected = {
      //         domainName: 'building',
      //         total: 3,
      //         results: [
      //            {
      //               name: 'A',
      //               status: 'opened',
      //               id: '1',
      //            },
      //            {
      //               name: 'C',
      //               status: 'opened',
      //               id: '3',
      //            },
      //            {
      //               name: 'D',
      //               status: 'work in progress',
      //               id: '4',
      //            },
      //         ],
      //      };
      //      test(input, role, domainRequestName, expected).then(done).catch(done);
      //   });
      //   it('get restricted data with filter on it', function (done) {
      //      const domainRequestName: DomainRequestName = 'building';
      //      const role = 'student';
      //      let input = {
      //         fields: { name: true, status: true },
      //         filters: {
      //            status: {
      //               operator: 'equals',
      //               value: 'opened',
      //            },
      //         },
      //      };

      //      const expected = {
      //         domainName: 'building',
      //         total: 2,
      //         results: [
      //            {
      //               name: 'A',
      //               status: 'opened',
      //               id: '1',
      //            },
      //            {
      //               name: 'C',
      //               status: 'opened',
      //               id: '3',
      //            },
      //         ],
      //      };
      //      test(input, role, domainRequestName, expected).then(done).catch(done);
      //   });
      //   it('get restricted data with 2 conditions filter on it', function (done) {
      //      const domainRequestName: DomainRequestName = 'building';
      //      const role = 'student';
      //      let input = {
      //         fields: { name: true, status: true },
      //         filters: {
      //            or: [
      //               {
      //                  status: {
      //                     operator: 'equals',
      //                     value: 'work in progress',
      //                  },
      //               },
      //               {
      //                  status: {
      //                     operator: 'equals',
      //                     value: 'opened',
      //                  },
      //               },
      //            ],
      //         },
      //      };

      //      const expected = {
      //         domainName: 'building',
      //         total: 3,
      //         results: [
      //            {
      //               name: 'A',
      //               status: 'opened',
      //               id: '1',
      //            },
      //            {
      //               name: 'C',
      //               status: 'opened',
      //               id: '3',
      //            },
      //            {
      //               name: 'D',
      //               status: 'work in progress',
      //               id: '4',
      //            },
      //         ],
      //      };
      //      test(input, role, domainRequestName, expected).then(done).catch(done);
      //   });
      //   it('get restricted data with unauthorized data filter on it', function (done) {
      //      const domainRequestName: DomainRequestName = 'building';
      //      const role = 'student';
      //      let input = {
      //         fields: { name: true, status: true },
      //         filters: {
      //            status: {
      //               operator: 'equals',
      //               value: 'closed',
      //            },
      //         },
      //      };

      //      // unauthorized filter data so ignore it
      //      const expected = {
      //         domainName: 'building',
      //         total: 3,
      //         results: [
      //            {
      //               name: 'A',
      //               status: 'opened',
      //               id: '1',
      //            },
      //            {
      //               name: 'C',
      //               status: 'opened',
      //               id: '3',
      //            },
      //            {
      //               name: 'D',
      //               status: 'work in progress',
      //               id: '4',
      //            },
      //         ],
      //      };
      //      test(input, role, domainRequestName, expected).then(done).catch(done);
      //   });
      //   it('get restricted data with 1 (out of 2) unauthorized data filter on it', function (done) {
      //      const domainRequestName: DomainRequestName = 'building';
      //      const role = 'student';
      //      let input = {
      //         fields: { name: true, status: true },
      //         filters: {
      //            or: [
      //               {
      //                  status: {
      //                     operator: 'equals',
      //                     value: 'closed',
      //                  },
      //               },
      //               {
      //                  status: {
      //                     operator: 'equals',
      //                     value: 'opened',
      //                  },
      //               },
      //            ],
      //         },
      //      };

      //      // unauthorized filter data so ignore it
      //      const expected = {
      //         domainName: 'building',
      //         total: 2,
      //         results: [
      //            {
      //               name: 'A',
      //               status: 'opened',
      //               id: '1',
      //            },
      //            {
      //               name: 'C',
      //               status: 'opened',
      //               id: '3',
      //            },
      //         ],
      //      };
      //      test(input, role, domainRequestName, expected).then(done).catch(done);
      //   });
      //   it('get restricted data with 2 (out of 2) unauthorized data filter on it', function (done) {
      //      const domainRequestName: DomainRequestName = 'building';
      //      const role = 'student';
      //      let input = {
      //         fields: { name: true, status: true },
      //         filters: {
      //            or: [
      //               {
      //                  status: {
      //                     operator: 'equals',
      //                     value: 'closed',
      //                  },
      //               },
      //               {
      //                  status: {
      //                     operator: 'equals',
      //                     value: 'closed',
      //                  },
      //               },
      //            ],
      //         },
      //      };

      //      // unauthorized filter data so ignore it
      //      const expected = {
      //         domainName: 'building',
      //         total: 3,
      //         results: [
      //            {
      //               name: 'A',
      //               status: 'opened',
      //               id: '1',
      //            },
      //            {
      //               name: 'C',
      //               status: 'opened',
      //               id: '3',
      //            },
      //            {
      //               name: 'D',
      //               status: 'work in progress',
      //               id: '4',
      //            },
      //         ],
      //      };
      //      test(input, role, domainRequestName, expected).then(done).catch(done);
      //   });
      //   it('get restricted data with 2 (out of 2) unauthorized data filter on it, in "or" and direct filter', function (done) {
      //      const domainRequestName: DomainRequestName = 'building';
      //      const role = 'student';
      //      let input = {
      //         fields: { name: true, status: true },
      //         filters: {
      //            status: {
      //               operator: 'equals',
      //               value: 'closed',
      //            },
      //            or: [
      //               {
      //                  status: {
      //                     operator: 'equals',
      //                     value: 'closed',
      //                  },
      //               },
      //               {
      //                  status: {
      //                     operator: 'equals',
      //                     value: 'closed',
      //                  },
      //               },
      //            ],
      //         },
      //      };

      //      // unauthorized filter data so ignore it
      //      const expected = {
      //         domainName: 'building',
      //         total: 3,
      //         results: [
      //            {
      //               name: 'A',
      //               status: 'opened',
      //               id: '1',
      //            },
      //            {
      //               name: 'C',
      //               status: 'opened',
      //               id: '3',
      //            },
      //            {
      //               name: 'D',
      //               status: 'work in progress',
      //               id: '4',
      //            },
      //         ],
      //      };
      //      test(input, role, domainRequestName, expected).then(done).catch(done);
      //   });
   });
   describe('fields misuse', () => {
      it('requests existing fields with filter isIn on non natural key', function (done) {
         const domainRequestName: DomainRequestName = 'country';
         const role = 'student';
         let input = {
            fields: {
               name: true,
               timezone: true,
            },
            filters: { name: { operator: 'is_in', value: '3,1' } },
            options: {},
         };

         const expected = {
            domainName: 'country',
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
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
      it('requests existing fields with filter isIn with invalid values', function (done) {
         const domainRequestName: DomainRequestName = 'country';
         const role = 'student';
         let input = {
            fields: {
               name: true,
               timezone: true,
            },
            filters: { id: { operator: 'is_in', value: '3   ,undefined, null  , ,  "   "  , 1,   "" ' } },
            options: {},
         };

         const expected = {
            domainName: 'country',
            total: 1,
            results: [
               {
                  name: 'france',
                  timezone: 'Europe/Paris',
                  id: '1',
               },
            ],
         };
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
   });
});

interface Expected {
   total: number;
   results: any[];
}
async function test(input: any, role: Role, domainRequestName: DomainRequestName, expected: Expected): Promise<void> {
   const handler = getDomainRequestHandler(domainRequestName);
   const domainRequestBuilder = handler.getRoleDomainRequestBuilder(role);
   const buildResult = domainRequestBuilder.build(input, []);
   const result = await handler.fetchData(buildResult.request);

   expect(result.domainName).to.equals(domainRequestName);
   expect(result.total).to.equals(expected.total);
   expect(result.results).to.deep.equals(expected.results);
}
