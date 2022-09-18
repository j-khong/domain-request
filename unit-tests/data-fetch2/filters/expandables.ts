import { DomainRequestName } from '../../domain-requests/types.ts';
import { test } from '../test.ts';
import { resetClient } from '../../persistence/database/dbUtils.ts';
import { afterEach, /* beforeEach, */ describe, it } from '../mod.ts';

describe('Data fetch with filters on expandables ', () => {
   afterEach(async () => {
      await resetClient();
   });

   describe('level 1 expandable', () => {
      it('select fields and filter on it', async () => {
         const domainRequestName: DomainRequestName = 'courseApplication';
         const role = 'admin';
         const input = {
            fields: {
               student_id: true,
               course_id: true,
            },
            expandables: {
               student: {
                  fields: {
                     firstname: true,
                     year_of_birth: true,
                  },
                  filters: {
                     year_of_birth: { operator: 'between', value: [1970, 1971] },
                  },
                  expandables: {
                     category: {
                        fields: {
                           name: true,
                        },
                     },
                  },
               },
            },
         };
         const expected = {
            domainName: 'courseApplication',
            total: 4,
            results: [
               {
                  studentId: '1',
                  courseId: '1',
                  expandables: {
                     student: {
                        fields: {
                           firstname: 'pierre',
                           yearOfBirth: 1970,
                           categoryId: '2',
                        },
                     },
                  },
               },
               {
                  studentId: '1',
                  courseId: '2',
                  expandables: {
                     student: {
                        fields: {
                           firstname: 'pierre',
                           yearOfBirth: 1970,
                           categoryId: '2',
                        },
                     },
                  },
               },
               {
                  studentId: '1',
                  courseId: '3',
                  expandables: {
                     student: {
                        fields: {
                           firstname: 'pierre',
                           yearOfBirth: 1970,
                           categoryId: '2',
                        },
                     },
                  },
               },
               {
                  studentId: '2',
                  courseId: '1',
                  expandables: {
                     student: {
                        fields: {
                           firstname: 'jeanne',
                           yearOfBirth: 1971,
                           categoryId: '1',
                        },
                     },
                  },
               },
            ],
         };
         await test(input, role, domainRequestName, expected);
      });
   });
   describe('level 2 expandable', () => {
      it('select fields and filter on it', async () => {
         const domainRequestName: DomainRequestName = 'courseApplication';
         const role = 'admin';
         const input = {
            fields: {
               student_id: true,
               course_id: true,
            },
            expandables: {
               student: {
                  fields: {
                     firstname: true,
                     year_of_birth: true,
                  },
                  expandables: {
                     category: {
                        fields: {
                           name: true,
                        },
                        filters: {
                           name: { operator: 'equals', value: 'Arts' },
                        },
                     },
                  },
               },
            },
         };
         const expected = {
            total: 1,
            domainName: 'courseApplication',
            results: [
               {
                  studentId: '2',
                  courseId: '1',
                  expandables: {
                     student: {
                        fields: {
                           firstname: 'jeanne',
                           yearOfBirth: 1971,
                           categoryId: '1',
                        },
                        expandables: {
                           studentCategory: {
                              fields: {
                                 name: 'Arts',
                              },
                           },
                        },
                     },
                  },
               },
            ],
         };
         await test(input, role, domainRequestName, expected);
      });
   });
   describe('level 3 expandable', () => {});
});
