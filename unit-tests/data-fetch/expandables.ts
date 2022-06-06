import 'mocha';
import { expect } from 'chai';

import { getDomainRequestHandler } from '../domain-requests/init';
import { DomainRequestName, Role } from '../domain-requests/types';

describe('Data fetch for expandables', () => {
   describe('expandable fields', () => {
      it('1 expandable 1to1 only', function (done) {
         const domainRequestName: DomainRequestName = 'student';
         const role = 'student';
         let input = {
            fields: {},
            filters: {},
            expandables: {
               country: {
                  fields: {
                     name: true,
                     timezone: true,
                  },
               },
            },
         };

         const expected = {
            domainName: 'student',
            total: 2,
            results: [
               {
                  id: '1',
                  expandables: {
                     country: {
                        name: 'france',
                        timezone: 'Europe/Paris',
                     },
                  },
               },
               {
                  id: '2',
                  expandables: {
                     country: {
                        name: 'france',
                        timezone: 'Europe/Paris',
                     },
                  },
               },
            ],
         };
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
      it('1 expandable 1toN only', function (done) {
         const domainRequestName: DomainRequestName = 'student';
         const role = 'student';
         let input = {
            expandables: {
               course_application: {
                  fields: {
                     course_id: true,
                     student_id: true,
                  },
               },
            },
         };

         // no data => use directly the resource instead of expanding
         const expected = {
            domainName: 'student',
            total: 0,
            results: [],
         };
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
      it('1 field + 1 expandable 1toN', function (done) {
         const domainRequestName: DomainRequestName = 'student';
         const role = 'student';
         let input = {
            fields: { firstname: true },
            expandables: {
               course_application: {
                  fields: {
                     course_id: true,
                     student_id: true,
                  },
               },
            },
         };

         const expected = {
            domainName: 'student',
            total: 2,
            results: [
               {
                  firstname: 'pierre',
                  id: '1',
                  expandables: {
                     courseApplication: [
                        {
                           courseId: '1',
                           id: '1',
                        },
                        {
                           courseId: '2',
                           id: '3',
                        },
                        {
                           courseId: '3',
                           id: '4',
                        },
                     ],
                  },
               },
               {
                  firstname: 'jeanne',
                  id: '2',
                  expandables: {
                     courseApplication: [
                        {
                           courseId: '1',
                           id: '2',
                        },
                     ],
                  },
               },
            ],
         };
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
      it('1 field + 1 expandable 1toN + 1 level 2 expandable', function (done) {
         const domainRequestName: DomainRequestName = 'student';
         const role = 'student';
         let input = {
            fields: { firstname: true },
            expandables: {
               course_application: {
                  fields: {
                     course_id: true,
                     student_id: true,
                  },
                  expandables: {
                     course: { fields: { name: true } },
                  },
               },
            },
         };

         const expected = {
            domainName: 'student',
            total: 2,
            results: [
               {
                  firstname: 'pierre',
                  id: '1',
                  expandables: {
                     courseApplication: [
                        {
                           courseId: '1',
                           id: '1',
                           expandables: {
                              course: {
                                 name: 'Math 101',
                              },
                           },
                        },
                        {
                           courseId: '2',
                           id: '3',
                           expandables: {
                              course: {
                                 name: 'Arts',
                              },
                           },
                        },
                        {
                           courseId: '3',
                           id: '4',
                           expandables: {
                              course: {
                                 name: 'History',
                              },
                           },
                        },
                     ],
                  },
               },
               {
                  firstname: 'jeanne',
                  id: '2',
                  expandables: {
                     courseApplication: [
                        {
                           courseId: '1',
                           id: '2',
                           expandables: {
                              course: {
                                 name: 'Math 101',
                              },
                           },
                        },
                     ],
                  },
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
   const buildResult = domainRequestBuilder.build(input);
   const result = await handler.fetchData(buildResult.request);

   expect(result.domainName).to.equals(domainRequestName);
   expect(result.total).to.equals(expected.total);
   expect(result.results).to.deep.equals(expected.results);
}

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
