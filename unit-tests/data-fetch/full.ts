import 'mocha';
import { test } from './test';
import { DomainRequestName } from '../domain-requests/types';

describe('Data fetch for extended & expandables', () => {
   //   it('requests 1 existing field', async () => {
   //      const domainRequestName: DomainRequestName = 'building';
   //      const role = 'student';
   //      const input = {
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
   //      await test(input, role, domainRequestName, expected)
   //         .then(() => {
   //            // should have same result with a trivial filter
   //            (input.filters as any).id = {
   //               operator: 'greater_than',
   //               value: '0',
   //            };
   //            test(input, role, domainRequestName, expected)
   //         })
   //         .catch(done);
   //   });
   //   it('requests 1 existing field', async () => {
   //      const domainRequestName: DomainRequestName = 'building';
   //      const role = 'student';
   //      const input = {
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
   // await           test(input, role, domainRequestName, expected)
   //         })
   //         .catch(done);
   //   });
   //   it('requests 1 existing field', async () => {
   //      const domainRequestName: DomainRequestName = 'building';
   //      const role = 'student';
   //      const input = {
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
   // await     test(input, role, domainRequestName, expected)
   //   });
   //   it('get restricted data', async () => {
   //      const domainRequestName: DomainRequestName = 'building';
   //      const role = 'student';
   //      const input = {
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
   // await     test(input, role, domainRequestName, expected)
   //   });
   //   it('get restricted data with filter on it', async () => {
   //      const domainRequestName: DomainRequestName = 'building';
   //      const role = 'student';
   //      const input = {
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
   // await     test(input, role, domainRequestName, expected)
   //   });
   //   it('get restricted data with 2 conditions filter on it', async () => {
   //      const domainRequestName: DomainRequestName = 'building';
   //      const role = 'student';
   //      const input = {
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
   // await     test(input, role, domainRequestName, expected)
   //   });
   //   it('get restricted data with unauthorized data filter on it', async () => {
   //      const domainRequestName: DomainRequestName = 'building';
   //      const role = 'student';
   //      const input = {
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
   // await     test(input, role, domainRequestName, expected)
   //   });
   //   it('get restricted data with 1 (out of 2) unauthorized data filter on it', async () => {
   //      const domainRequestName: DomainRequestName = 'building';
   //      const role = 'student';
   //      const input = {
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
   // await     test(input, role, domainRequestName, expected)
   //   });
   //   it('get restricted data with 2 (out of 2) unauthorized data filter on it', async () => {
   //      const domainRequestName: DomainRequestName = 'building';
   //      const role = 'student';
   //      const input = {
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
   // await     test(input, role, domainRequestName, expected)
   //   });
   //   it('get restricted data with 2 (out of 2) unauthorized data filter on it, in "or" and direct filter', async () => {
   //      const domainRequestName: DomainRequestName = 'building';
   //      const role = 'student';
   //      const input = {
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
   // await     test(input, role, domainRequestName, expected)
   //   });
   describe('extended & expandable fields', () => {
      it('1 extended 1toN & 1 expandable 1toN', function (done) {
         const domainRequestName: DomainRequestName = 'building';
         const role = 'student';
         let input = {
            fields: { name: true, pictures: { fields: { url: true } } },
            filters: {},
            expandables: {
               sponsors: {
                  fields: {
                     id: true,
                  },
                  expandables: {
                     sponsor: { fields: { name: true } },
                  },
               },
            },
         };

         const expected = {
            total: 3,
            results: [
               {
                  name: 'A',
                  id: '1',
                  expandables: {
                     buildingSponsor: [
                        {
                           id: '1',
                           expandables: {
                              sponsor: {
                                 name: 'Rockefeller',
                              },
                           },
                        },
                        {
                           id: '2',
                           expandables: {
                              sponsor: {
                                 name: 'Carnegie',
                              },
                           },
                        },
                     ],
                  },
                  pictures: [
                     {
                        url: 'https://harvardplanning.emuseum.com/internal/media/dispatcher/145625/preview',
                     },
                  ],
               },
               {
                  name: 'C',
                  id: '3',
                  pictures: [
                     {
                        url: 'https://blog.prepscholar.com/hs-fs/hubfs/feature_harvardbuilding2-1.jpg',
                     },
                  ],
               },
               {
                  name: 'D',
                  id: '4',
                  pictures: [
                     {
                        url: 'https://i1.wp.com/www.thefrontdoorproject.com/wp-content/uploads/2016/03/IMG_4910.jpg',
                     },
                  ],
               },
            ],
         };
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
   });
});
