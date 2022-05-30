import 'mocha';
import { expect } from 'chai';

import { getDomainRequestHandler } from './domains/init';
import { DomainRequestName, Role } from './domains/types';

describe('Data fetch tests ', () => {
   describe('fields and extended', () => {
      it('requests 1 existing field', function (done) {
         const domainRequestName: DomainRequestName = 'building';
         const role = 'student';
         let input = {
            fields: {
               name: true,
               status: true,
               opening_hours: { fields: { day: true, slots: { fields: { start: true, end: true } } } },
            },
            filters: {
               or: [
                  {
                     name: {
                        operator: 'equals',
                        value: 'A',
                     },
                  },
                  {
                     name: {
                        operator: 'equals',
                        value: 'B',
                     },
                  },
               ],
            },
            options: {
               orderby: 'id desc',
            },
         };

         const expected = {
            domainName: 'building',
            total: 1,
            results: [
               {
                  name: 'A',
                  status: 'opened',
                  id: 1,
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
      it('requests 1 existing field', function (done) {
         const domainRequestName: DomainRequestName = 'building';
         const role = 'student';
         let input = {
            fields: {
               name: true,
               status: true,
               opening_hours: { fields: { day: true, slots: { fields: { start: true } } } },
            },
            filters: {
               or: [
                  {
                     name: {
                        operator: 'equals',
                        value: 'A',
                     },
                  },
                  {
                     name: {
                        operator: 'equals',
                        value: 'B',
                     },
                  },
               ],
            },
            options: {
               orderby: 'id desc',
            },
         };

         const expected = {
            domainName: 'building',
            total: 1,
            results: [
               {
                  name: 'A',
                  status: 'opened',
                  id: 1,
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
      it('requests 1 existing field', function (done) {
         const domainRequestName: DomainRequestName = 'building';
         const role = 'student';
         let input = {
            fields: { name: true, status: true, opening_hours: { fields: { day: true } } },
            filters: {
               or: [
                  {
                     name: {
                        operator: 'equals',
                        value: 'A',
                     },
                  },
                  {
                     name: {
                        operator: 'equals',
                        value: 'B',
                     },
                  },
               ],
            },
            options: {
               orderby: 'id desc',
            },
         };

         const expected = {
            domainName: 'building',
            total: 1,
            results: [
               {
                  name: 'A',
                  status: 'opened',
                  id: 1,
                  openingHours: [
                     {
                        day: 1,
                     },
                     {
                        day: 3,
                     },
                  ],
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
      it('requests 1 extended field only', function (done) {
         const domainRequestName: DomainRequestName = 'building';
         const role = 'student';
         let input = {
            fields: { opening_hours: { fields: { day: true } } },
            filters: {
               or: [
                  {
                     name: {
                        operator: 'equals',
                        value: 'A',
                     },
                  },
                  {
                     name: {
                        operator: 'equals',
                        value: 'B',
                     },
                  },
               ],
            },
            options: {
               orderby: 'id desc',
            },
         };

         const expected = {
            domainName: 'building',
            total: 1,
            results: [
               {
                  id: 1,
                  openingHours: [
                     {
                        day: 1,
                     },
                     {
                        day: 3,
                     },
                  ],
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
      it('requests 1 existing field', function (done) {
         const domainRequestName: DomainRequestName = 'building';
         const role = 'student';
         let input = {
            fields: { name: true, status: true },
            filters: {
               and: [
                  {
                     name: {
                        operator: 'equals',
                        value: 'A',
                     },
                  },
                  {
                     name: {
                        operator: 'equals',
                        value: 'B',
                     },
                  },
               ],
            },
            options: {
               orderby: 'id desc',
            },
         };

         const expected = {
            domainName: 'building',
            total: 0,
            results: [],
         };
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
      it('get restricted data', function (done) {
         const domainRequestName: DomainRequestName = 'building';
         const role = 'student';
         let input = {
            fields: { name: true, status: true },
         };

         const expected = {
            domainName: 'building',
            total: 3,
            results: [
               {
                  name: 'A',
                  status: 'opened',
                  id: 1,
               },
               {
                  name: 'C',
                  status: 'opened',
                  id: 3,
               },
               {
                  name: 'D',
                  status: 'work in progress',
                  id: 4,
               },
            ],
         };
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
      it('get restricted data with filter on it', function (done) {
         const domainRequestName: DomainRequestName = 'building';
         const role = 'student';
         let input = {
            fields: { name: true, status: true },
            filters: {
               status: {
                  operator: 'equals',
                  value: 'opened',
               },
            },
         };

         const expected = {
            domainName: 'building',
            total: 2,
            results: [
               {
                  name: 'A',
                  status: 'opened',
                  id: 1,
               },
               {
                  name: 'C',
                  status: 'opened',
                  id: 3,
               },
            ],
         };
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
      it('get restricted data with 2 conditions filter on it', function (done) {
         const domainRequestName: DomainRequestName = 'building';
         const role = 'student';
         let input = {
            fields: { name: true, status: true },
            filters: {
               or: [
                  {
                     status: {
                        operator: 'equals',
                        value: 'work in progress',
                     },
                  },
                  {
                     status: {
                        operator: 'equals',
                        value: 'opened',
                     },
                  },
               ],
            },
         };

         const expected = {
            domainName: 'building',
            total: 3,
            results: [
               {
                  name: 'A',
                  status: 'opened',
                  id: 1,
               },
               {
                  name: 'C',
                  status: 'opened',
                  id: 3,
               },
               {
                  name: 'D',
                  status: 'work in progress',
                  id: 4,
               },
            ],
         };
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
      it('get restricted data with unauthorized data filter on it', function (done) {
         const domainRequestName: DomainRequestName = 'building';
         const role = 'student';
         let input = {
            fields: { name: true, status: true },
            filters: {
               status: {
                  operator: 'equals',
                  value: 'closed',
               },
            },
         };

         // unauthorized filter data so ignore it
         const expected = {
            domainName: 'building',
            total: 3,
            results: [
               {
                  name: 'A',
                  status: 'opened',
                  id: 1,
               },
               {
                  name: 'C',
                  status: 'opened',
                  id: 3,
               },
               {
                  name: 'D',
                  status: 'work in progress',
                  id: 4,
               },
            ],
         };
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
      it('get restricted data with 1 (out of 2) unauthorized data filter on it', function (done) {
         const domainRequestName: DomainRequestName = 'building';
         const role = 'student';
         let input = {
            fields: { name: true, status: true },
            filters: {
               or: [
                  {
                     status: {
                        operator: 'equals',
                        value: 'closed',
                     },
                  },
                  {
                     status: {
                        operator: 'equals',
                        value: 'opened',
                     },
                  },
               ],
            },
         };

         // unauthorized filter data so ignore it
         const expected = {
            domainName: 'building',
            total: 2,
            results: [
               {
                  name: 'A',
                  status: 'opened',
                  id: 1,
               },
               {
                  name: 'C',
                  status: 'opened',
                  id: 3,
               },
            ],
         };
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
      it('get restricted data with 2 (out of 2) unauthorized data filter on it', function (done) {
         const domainRequestName: DomainRequestName = 'building';
         const role = 'student';
         let input = {
            fields: { name: true, status: true },
            filters: {
               or: [
                  {
                     status: {
                        operator: 'equals',
                        value: 'closed',
                     },
                  },
                  {
                     status: {
                        operator: 'equals',
                        value: 'closed',
                     },
                  },
               ],
            },
         };

         // unauthorized filter data so ignore it
         const expected = {
            domainName: 'building',
            total: 3,
            results: [
               {
                  name: 'A',
                  status: 'opened',
                  id: 1,
               },
               {
                  name: 'C',
                  status: 'opened',
                  id: 3,
               },
               {
                  name: 'D',
                  status: 'work in progress',
                  id: 4,
               },
            ],
         };
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
      it('get restricted data with 2 (out of 2) unauthorized data filter on it, in "or" and direct filter', function (done) {
         const domainRequestName: DomainRequestName = 'building';
         const role = 'student';
         let input = {
            fields: { name: true, status: true },
            filters: {
               status: {
                  operator: 'equals',
                  value: 'closed',
               },
               or: [
                  {
                     status: {
                        operator: 'equals',
                        value: 'closed',
                     },
                  },
                  {
                     status: {
                        operator: 'equals',
                        value: 'closed',
                     },
                  },
               ],
            },
         };

         // unauthorized filter data so ignore it
         const expected = {
            domainName: 'building',
            total: 3,
            results: [
               {
                  name: 'A',
                  status: 'opened',
                  id: 1,
               },
               {
                  name: 'C',
                  status: 'opened',
                  id: 3,
               },
               {
                  name: 'D',
                  status: 'work in progress',
                  id: 4,
               },
            ],
         };
         test(input, role, domainRequestName, expected).then(done).catch(done);
      });
   });
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

         // unauthorized filter data so ignore it
         const expected = {
            domainName: 'student',
            total: 2,
            results: [
               {
                  id: 1,
                  expandables: {
                     country: {
                        name: 'france',
                        timezone: 'Europe/Paris',
                     },
                  },
               },
               {
                  id: 2,
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
                  id: 1,
                  expandables: {
                     courseApplication: [
                        {
                           courseId: 1,
                           id: 1,
                        },
                        {
                           courseId: 2,
                           id: 3,
                        },
                        {
                           courseId: 3,
                           id: 4,
                        },
                     ],
                  },
               },
               {
                  firstname: 'jeanne',
                  id: 2,
                  expandables: {
                     courseApplication: [
                        {
                           courseId: 1,
                           id: 2,
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
                  id: 1,
                  expandables: {
                     courseApplication: [
                        {
                           courseId: 1,
                           id: 1,
                           expandables: {
                              course: {
                                 name: 'Math 101',
                              },
                           },
                        },
                        {
                           courseId: 2,
                           id: 3,
                           expandables: {
                              course: {
                                 name: 'Arts',
                              },
                           },
                        },
                        {
                           courseId: 3,
                           id: 4,
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
                  id: 2,
                  expandables: {
                     courseApplication: [
                        {
                           courseId: 1,
                           id: 2,
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
   const buildResult = domainRequestBuilder.build(input, []);
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
