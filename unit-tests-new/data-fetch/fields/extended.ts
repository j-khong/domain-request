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

describe('Data fetch with one to many fields', () => {
   afterEach(async () => {
      await resetClient();
   });

   it('requests with 1 1toN field', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            pictures: {
               url: true,
               name: true,
               status: true,
            },
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 4,
         results: [
            {
               id: '1',
               pictures: [
                  {
                     url: 'https://harvardplanning.emuseum.com/internal/media/dispatcher/145625/preview',
                     name: 'A',
                     status: 'on',
                  },
                  {
                     url: 'https://static.independent.co.uk/s3fs-public/thumbnails/image/2015/11/16/18/harvard.jpg?quality=75&width=990&auto=webp&crop=982:726,smart',
                     name: 'B',
                     status: 'on',
                  },
                  {
                     url: 'https://blog.prepscholar.com/hs-fs/hubfs/feature_harvardbuilding2-1.jpg',
                     name: 'C',
                     status: 'on',
                  },
                  {
                     url: 'https://i1.wp.com/www.thefrontdoorproject.com/wp-content/uploads/2016/03/IMG_4910.jpg',
                     name: 'D',
                     status: 'on',
                  },
               ],
            },
            {
               id: '4',
               pictures: [
                  {
                     url: 'https://i1.wp.com/www.thefrontdoorproject.com/wp-content/uploads/2016/03/IMG_4910.jpg',
                     name: 'D',
                     status: 'on',
                  },
               ],
            },
            {
               id: '2',
               pictures: [
                  {
                     url: 'https://static.independent.co.uk/s3fs-public/thumbnails/image/2015/11/16/18/harvard.jpg?quality=75&width=990&auto=webp&crop=982:726,smart',
                     name: 'B',
                     status: 'on',
                  },
                  {
                     url: 'https://blog.prepscholar.com/hs-fs/hubfs/feature_harvardbuilding2-1.jpg',
                     name: 'C',
                     status: 'on',
                  },
                  {
                     url: 'https://i1.wp.com/www.thefrontdoorproject.com/wp-content/uploads/2016/03/IMG_4910.jpg',
                     name: 'D',
                     status: 'on',
                  },
               ],
            },
            {
               id: '3',
               pictures: [
                  {
                     url: 'https://blog.prepscholar.com/hs-fs/hubfs/feature_harvardbuilding2-1.jpg',
                     name: 'C',
                     status: 'on',
                  },
                  {
                     url: 'https://i1.wp.com/www.thefrontdoorproject.com/wp-content/uploads/2016/03/IMG_4910.jpg',
                     name: 'D',
                     status: 'on',
                  },
               ],
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests with 1 field, 1 1to1 field, 1 1toN field', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
            type: { name: true },
            pictures: {
               url: true,
               name: true,
               status: true,
            },
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
               id: '1',
               pictures: [
                  {
                     url: 'https://harvardplanning.emuseum.com/internal/media/dispatcher/145625/preview',
                     name: 'A',
                     status: 'on',
                  },
                  {
                     url: 'https://static.independent.co.uk/s3fs-public/thumbnails/image/2015/11/16/18/harvard.jpg?quality=75&width=990&auto=webp&crop=982:726,smart',
                     name: 'B',
                     status: 'on',
                  },
                  {
                     url: 'https://blog.prepscholar.com/hs-fs/hubfs/feature_harvardbuilding2-1.jpg',
                     name: 'C',
                     status: 'on',
                  },
                  {
                     url: 'https://i1.wp.com/www.thefrontdoorproject.com/wp-content/uploads/2016/03/IMG_4910.jpg',
                     name: 'D',
                     status: 'on',
                  },
               ],
            },
            {
               name: 'B',
               type: {
                  name: 'Rococco',
               },
               id: '2',
               pictures: [
                  {
                     url: 'https://static.independent.co.uk/s3fs-public/thumbnails/image/2015/11/16/18/harvard.jpg?quality=75&width=990&auto=webp&crop=982:726,smart',
                     name: 'B',
                     status: 'on',
                  },
                  {
                     url: 'https://blog.prepscholar.com/hs-fs/hubfs/feature_harvardbuilding2-1.jpg',
                     name: 'C',
                     status: 'on',
                  },
                  {
                     url: 'https://i1.wp.com/www.thefrontdoorproject.com/wp-content/uploads/2016/03/IMG_4910.jpg',
                     name: 'D',
                     status: 'on',
                  },
               ],
            },
            {
               name: 'C',
               type: {
                  name: 'New Age',
               },
               id: '3',
               pictures: [
                  {
                     url: 'https://blog.prepscholar.com/hs-fs/hubfs/feature_harvardbuilding2-1.jpg',
                     name: 'C',
                     status: 'on',
                  },
                  {
                     url: 'https://i1.wp.com/www.thefrontdoorproject.com/wp-content/uploads/2016/03/IMG_4910.jpg',
                     name: 'D',
                     status: 'on',
                  },
               ],
            },
            {
               name: 'D',
               type: {
                  name: 'Colonial',
               },
               id: '4',
               pictures: [
                  {
                     url: 'https://i1.wp.com/www.thefrontdoorproject.com/wp-content/uploads/2016/03/IMG_4910.jpg',
                     name: 'D',
                     status: 'on',
                  },
               ],
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests with 1 1to1 field as same object', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
            category: true,
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 4,
         results: [
            {
               name: 'A',
               category: 'Colonial',
               id: '1',
            },
            {
               name: 'B',
               category: 'Rococco',
               id: '2',
            },
            {
               name: 'C',
               category: 'New Age',
               id: '3',
            },
            {
               name: 'D',
               category: 'Colonial',
               id: '4',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests with 1 field, 2 1to1 fields, 2 1toN fields', async () => {
      const domainRequestName: DomainRequestName = 'building';
      const role = 'admin';
      const input = {
         fields: {
            name: true,
            status: true,
            type: {
               name: true,
            },
            architect: {
               name: true,
               rating: { rate: true, rater: { name: true } },
            },
            sponsors: {
               id: true,
               name: true,
               contribution: true,
            },
            pictures: {
               url: true,
               name: true,
               status: true,
            },
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
               status: 'opened',
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
               sponsors: [
                  {
                     id: '1',
                     name: 'Rockefeller',
                     contribution: 100,
                  },
                  {
                     id: '2',
                     name: 'Carnegie',
                     contribution: 200,
                  },
               ],
               pictures: [
                  {
                     url: 'https://harvardplanning.emuseum.com/internal/media/dispatcher/145625/preview',
                     name: 'A',
                     status: 'on',
                  },
                  {
                     url: 'https://static.independent.co.uk/s3fs-public/thumbnails/image/2015/11/16/18/harvard.jpg?quality=75&width=990&auto=webp&crop=982:726,smart',
                     name: 'B',
                     status: 'on',
                  },
                  {
                     url: 'https://blog.prepscholar.com/hs-fs/hubfs/feature_harvardbuilding2-1.jpg',
                     name: 'C',
                     status: 'on',
                  },
                  {
                     url: 'https://i1.wp.com/www.thefrontdoorproject.com/wp-content/uploads/2016/03/IMG_4910.jpg',
                     name: 'D',
                     status: 'on',
                  },
               ],
            },
            {
               name: 'B',
               type: {
                  name: 'Rococco',
               },
               status: 'closed',
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
               sponsors: [
                  {
                     id: '2',
                     name: 'Carnegie',
                     contribution: 500,
                  },
               ],
               pictures: [
                  {
                     url: 'https://static.independent.co.uk/s3fs-public/thumbnails/image/2015/11/16/18/harvard.jpg?quality=75&width=990&auto=webp&crop=982:726,smart',
                     name: 'B',
                     status: 'on',
                  },
                  {
                     url: 'https://blog.prepscholar.com/hs-fs/hubfs/feature_harvardbuilding2-1.jpg',
                     name: 'C',
                     status: 'on',
                  },
                  {
                     url: 'https://i1.wp.com/www.thefrontdoorproject.com/wp-content/uploads/2016/03/IMG_4910.jpg',
                     name: 'D',
                     status: 'on',
                  },
               ],
            },
            {
               name: 'C',
               type: {
                  name: 'New Age',
               },
               status: 'opened',
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
               pictures: [
                  {
                     url: 'https://blog.prepscholar.com/hs-fs/hubfs/feature_harvardbuilding2-1.jpg',
                     name: 'C',
                     status: 'on',
                  },
                  {
                     url: 'https://i1.wp.com/www.thefrontdoorproject.com/wp-content/uploads/2016/03/IMG_4910.jpg',
                     name: 'D',
                     status: 'on',
                  },
               ],
            },
            {
               name: 'D',
               type: {
                  name: 'Colonial',
               },
               status: 'work in progress',
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
               pictures: [
                  {
                     url: 'https://i1.wp.com/www.thefrontdoorproject.com/wp-content/uploads/2016/03/IMG_4910.jpg',
                     name: 'D',
                     status: 'on',
                  },
               ],
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests with 1 1to1 field who has 1 1toN field (3 fields), 2 fields', async () => {
      const domainRequestName: DomainRequestName = 'buildingSponsor';
      const role = 'admin';
      const input = {
         fields: {
            building: {
               name: true,
               category: true,
               pictures: {
                  url: true,
                  name: true,
                  status: true,
               },
            },
         },
         filters: {
            sponsor: {
               name: {
                  value: 'Rockefeller',
                  operator: 'equals',
               },
            },
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 1,
         results: [
            {
               building: {
                  name: 'A',
                  category: 'Colonial',
                  pictures: [
                     {
                        url: 'https://harvardplanning.emuseum.com/internal/media/dispatcher/145625/preview',
                        name: 'A',
                        status: 'on',
                     },
                     {
                        url: 'https://static.independent.co.uk/s3fs-public/thumbnails/image/2015/11/16/18/harvard.jpg?quality=75&width=990&auto=webp&crop=982:726,smart',
                        name: 'B',
                        status: 'on',
                     },
                     {
                        url: 'https://blog.prepscholar.com/hs-fs/hubfs/feature_harvardbuilding2-1.jpg',
                        name: 'C',
                        status: 'on',
                     },
                     {
                        url: 'https://i1.wp.com/www.thefrontdoorproject.com/wp-content/uploads/2016/03/IMG_4910.jpg',
                        name: 'D',
                        status: 'on',
                     },
                  ],
               },
               id: '1',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests with 1 1to1 field who has 1 1toN field (3 fields), 1 field', async () => {
      const domainRequestName: DomainRequestName = 'buildingSponsor';
      const role = 'admin';
      const input = {
         fields: {
            building: {
               name: true,
               pictures: {
                  url: true,
                  name: true,
                  status: true,
               },
            },
         },
         filters: {
            sponsor: {
               name: {
                  value: 'Rockefeller',
                  operator: 'equals',
               },
            },
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 1,
         results: [
            {
               building: {
                  name: 'A',
                  pictures: [
                     {
                        url: 'https://harvardplanning.emuseum.com/internal/media/dispatcher/145625/preview',
                        name: 'A',
                        status: 'on',
                     },
                     {
                        url: 'https://static.independent.co.uk/s3fs-public/thumbnails/image/2015/11/16/18/harvard.jpg?quality=75&width=990&auto=webp&crop=982:726,smart',
                        name: 'B',
                        status: 'on',
                     },
                     {
                        url: 'https://blog.prepscholar.com/hs-fs/hubfs/feature_harvardbuilding2-1.jpg',
                        name: 'C',
                        status: 'on',
                     },
                     {
                        url: 'https://i1.wp.com/www.thefrontdoorproject.com/wp-content/uploads/2016/03/IMG_4910.jpg',
                        name: 'D',
                        status: 'on',
                     },
                  ],
               },
               id: '1',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests with 1 1to1 field who has 1 1toN field (3 fields), 0 field', async () => {
      const domainRequestName: DomainRequestName = 'buildingSponsor';
      const role = 'admin';
      const input = {
         fields: {
            building: {
               pictures: {
                  url: true,
                  name: true,
                  status: true,
               },
            },
         },
         filters: {
            sponsor: {
               name: {
                  value: 'Rockefeller',
                  operator: 'equals',
               },
            },
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 1,
         results: [
            {
               building: {
                  pictures: [
                     {
                        url: 'https://harvardplanning.emuseum.com/internal/media/dispatcher/145625/preview',
                        name: 'A',
                        status: 'on',
                     },
                     {
                        url: 'https://static.independent.co.uk/s3fs-public/thumbnails/image/2015/11/16/18/harvard.jpg?quality=75&width=990&auto=webp&crop=982:726,smart',
                        name: 'B',
                        status: 'on',
                     },
                     {
                        url: 'https://blog.prepscholar.com/hs-fs/hubfs/feature_harvardbuilding2-1.jpg',
                        name: 'C',
                        status: 'on',
                     },
                     {
                        url: 'https://i1.wp.com/www.thefrontdoorproject.com/wp-content/uploads/2016/03/IMG_4910.jpg',
                        name: 'D',
                        status: 'on',
                     },
                  ],
               },
               id: '1',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });

   it('requests with 1 1to1 field who has 1 1toN field (1 field), 0 field', async () => {
      const domainRequestName: DomainRequestName = 'buildingSponsor';
      const role = 'admin';
      const input = {
         fields: {
            building: {
               pictures: { name: true },
            },
         },
         filters: {
            sponsor: {
               name: {
                  value: 'Rockefeller',
                  operator: 'equals',
               },
            },
         },
      };
      const expected = {
         domainName: domainRequestName,
         total: 1,
         results: [
            {
               building: {
                  pictures: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }],
               },
               id: '1',
            },
         ],
      };
      await test(input, role, domainRequestName, expected);
   });
});
