import 'mocha';
import { test } from './test';
import { DomainRequestName } from '../domain-requests/types';

describe('Data fetch for extended & expandables', () => {
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

// TODO
//
// tester fetch field extendable only

// typologie
// field primitifs
// field extendable (one to one ou one to many)
// field expandable (one to one ou one to many)

// tester avec un mapping domain - table different
// ex. domain "student" => table "students" (et pas student)

// tester avec un mapping domain field - table field different
// ex. domain field "studentId" => table field "id_student" (et pas student_id)
