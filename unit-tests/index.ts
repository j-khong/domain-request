import 'mocha';
import { expect } from 'chai';

import { init, getDomainRequestHandler } from './domains/init';
import { DomainRequest, DomainRequestBuilder, Tree } from '../src/DomainRequest';
import { DomainRequestName, Role } from './domains/types';

init();
describe('request simple fields (no expandables)', () => {
   describe('request fields only', () => {
      it('requests 1 existing field', () => {
         const role = 'admin';
         let input = {
            fields: {
               id: true,
            },
         };

         const expected = getDefaultExpected(role);
         expected.fields.id = true;
         test(input, role, expected);

         input = {
            fields: {
               id: 1,
            },
         } as any;
         test(input, role, expected);
      });

      it('requests 2 existing fields to show', () => {
         const role = 'admin';
         const input = {
            fields: {
               year_of_birth: true,
               firstname: true,
            },
         };

         const expected = getDefaultExpected(role);
         expected.fields.firstname = true;
         expected.fields.yearOfBirth = true;

         test(input, role, expected);
      });

      it('requests 2 existing fields : 1 to show, 1 not to', () => {
         const role = 'admin';
         const input = {
            fields: {
               id: false,
               firstname: true,
            },
         };

         const expected = getDefaultExpected(role);
         expected.fields.firstname = true;
         test(input, role, expected);
      });

      it('requests 1 existing fields and 1 unknown', () => {
         const role = 'admin';
         let input = {
            fields: {
               firstname: true,
               unknown_field: true,
            },
         };

         const expected = getDefaultExpected(role);
         expected.fields.firstname = true;
         test(input, role, expected);

         input = {
            fields: {
               firstname: true,
               unknown_field: false,
            },
         };
         test(input, role, expected);
      });

      it('requests 1 unknown', () => {
         const role = 'admin';
         let input = {
            fields: {
               unknown_field: true,
            },
         };

         const expected = getDefaultExpected(role);
         test(input, role, expected);
      });

      it('requests nothing', () => {
         const role = 'admin';
         const input = {
            fields: {},
         };

         const expected = getDefaultExpected(role);
         test(input, role, expected);
      });
   });

   describe('request filters only', () => {
      it('requests nothing', () => {
         const role = 'admin';
         const input = {
            fields: {},
            filters: {
               firstname: {
                  operator: 'equals',
                  value: 'julien',
               },
            },
         };

         const expected = getDefaultExpected(role);
         expected.filters = input.filters;
         test(input, role, expected);
      });

      it('requests nothing with incorrect filter', () => {
         const role = 'admin';
         const input = {
            fields: {},
            filters: {
               firstname: 'julien',
            },
         };

         const expected = getDefaultExpected(role);
         expected.errors = [
            {
               fieldName: 'firstname',
               reason: 'missing comparison operator for key [firstname]',
            },
         ];
         test(input, role, expected);
      });
   });

   describe('request fields with filters', () => {
      it('requests with unknown filter', () => {
         const role = 'admin';
         const input = {
            fields: {
               id: false,
               name: true,
               unknown_field: true,
            },
            filters: {
               firstname: {
                  operator: 'equals',
                  value: 'julien',
               },
               unknown_field: {
                  operator: 'equals',
                  value: 'some data',
               },
            },
         };

         const expected = getDefaultExpected(role);
         expected.filters.firstname = input.filters.firstname;
         test(input, role, expected);
      });

      it('requests with incorrect filter (missing comparator operator)', () => {
         const role = 'admin';
         const input = {
            fields: {
               id: false,
               firstname: true,
               unknown_field: true,
            },
            filters: {
               firstname: { value: 'juju' },
               unknown_field: 'some data',
            },
         };
         const expected = getDefaultExpected(role);
         expected.fields.firstname = true;
         expected.errors = [
            {
               fieldName: 'firstname',
               reason: 'missing comparison operator for key [firstname]',
            },
         ];
         test(input, role, expected);
      });

      it('requests with incorrect filter (missing comparator value)', () => {
         const role = 'admin';
         const input = {
            fields: {
               id: false,
               firstname: true,
               unknown_field: true,
            },
            filters: {
               firstname: { operator: 'equals' },
               unknown_field: 'some data',
            },
         };
         const expected = getDefaultExpected(role);
         expected.fields.firstname = true;
         expected.errors = [
            {
               fieldName: 'firstname',
               reason: 'missing comparison value for key [firstname]',
            },
         ];
         test(input, role, expected);
      });

      it('requests with incorrect filter (invalid comparator operator)', () => {
         const role = 'admin';
         const input = {
            fields: {
               id: false,
               firstname: true,
               unknown_field: true,
            },
            filters: {
               firstname: { operator: 'equal', value: 'julien' },
               unknown_field: 'some data',
            },
         };
         const expected = getDefaultExpected(role);
         expected.fields.firstname = true;
         expected.errors = [
            {
               fieldName: 'firstname',
               reason: 'invalid comparison operator [equal] for key [firstname]',
            },
         ];
         test(input, role, expected);
      });

      it('requests with correct equals filter', () => {
         const role = 'admin';
         const input = {
            fields: {
               id: false,
               firstname: true,
               unknown_field: true,
            },
            filters: {
               firstname: { operator: 'equals', value: 'julien' },
               unknown_field: 'some data',
            },
         };
         const expected = getDefaultExpected(role);
         expected.fields.firstname = true;
         expected.filters.firstname = input.filters.firstname;
         test(input, role, expected);
      });

      it('requests with correct contains filter', () => {
         const role = 'admin';
         const input = {
            fields: {
               id: false,
               firstname: true,
               unknown_field: true,
            },
            filters: {
               firstname: { operator: 'contains', value: 'ju' },
               unknown_field: 'some data',
            },
         };
         const expected = getDefaultExpected(role);
         expected.fields.firstname = true;
         expected.filters.firstname = input.filters.firstname;
         test(input, role, expected);
      });
   });

   describe('request fields with options', () => {
      it('requests with defined limit', () => {
         const role = 'admin';
         const input = {
            fields: {
               id: false,
               firstname: true,
               unknown_field: true,
            },
            options: {
               limit: 10,
            },
         };
         const expected = getDefaultExpected(role);
         expected.fields.firstname = true;
         expected.options.pagination.limit = 10;
         test(input, role, expected);
      });

      it('requests with defined over max limit', () => {
         const role = 'admin';
         const input = {
            fields: {
               id: false,
               firstname: true,
               unknown_field: true,
            },
            options: {
               limit: 10000,
            },
         };
         const expected = getDefaultExpected(role);
         expected.fields.firstname = true;
         expected.options.pagination.limit = 5000;
         test(input, role, expected);
      });
   });
});

describe('request with 1to1 expandables', () => {
   describe('request fields only', () => {
      it('requests existing fields', () => {
         const role = 'admin';
         let input = {
            fields: {
               firstname: true,
            },
            expandables: {
               country: {
                  fields: {
                     name: true,
                     timezone: true,
                  },
               },
            },
         };

         const expected = getDefaultExpected(role);
         expected.fields.firstname = true;
         expected.expandables.country.fields.name = true;
         expected.expandables.country.fields.timezone = true;
         test(input, role, expected);
      });

      it('requests unknown expandable', () => {
         const role = 'admin';
         let input = {
            fields: {
               firstname: true,
            },
            expandables: {
               countr: {
                  fields: {
                     name: true,
                     timezone: true,
                  },
               },
            },
         };

         const expected = getDefaultExpected(role);
         expected.fields.firstname = true;
         test(input, role, expected);
      });

      it('requests unknown expandable fields', () => {
         const role = 'admin';
         let input = {
            fields: {
               firstname: true,
            },
            expandables: {
               country: {
                  fields: {
                     nam: true,
                     timezon: true,
                  },
               },
            },
         };

         const expected = getDefaultExpected(role);
         expected.fields.firstname = true;
         test(input, role, expected);
      });
   });
   describe('request fields with filter', () => {
      it('requests existing fields', () => {
         const role = 'admin';
         let input = {
            fields: {
               firstname: true,
            },
            expandables: {
               country: {
                  fields: {
                     name: true,
                     timezone: true,
                  },
                  filters: {
                     timezone: {
                        operator: 'equals',
                        value: 'Europe/Paris',
                     },
                  },
               },
               course_application: {
                  fields: {
                     course_id: true,
                  },
               },
            },
         };

         const expected = getDefaultExpected(role);
         expected.fields.firstname = true;
         expected.expandables.courseApplication.fields.courseId = true;
         expected.expandables.country.fields.name = true;
         expected.expandables.country.fields.timezone = true;
         expected.expandables.country.filters = input.expandables.country.filters;
         test(input, role, expected);
      });

      it('requests existing fields with invalid filter', () => {
         const role = 'admin';
         let input = {
            fields: {
               firstname: true,
            },
            expandables: {
               country: {
                  fields: {
                     name: true,
                     timezone: true,
                  },
                  filters: {
                     timezone: {
                        operato: 'equals',
                        value: 'Europe/Paris',
                     },
                  },
               },
            },
         };

         const expected = getDefaultExpected(role);
         expected.fields.firstname = true;
         expected.expandables.country.fields.name = true;
         expected.expandables.country.fields.timezone = true;
         expected.errors = [
            {
               fieldName: 'timezone',
               reason: 'missing comparison operator for key [timezone]',
            },
         ];

         test(input, role, expected);
      });
   });
});

describe('request with 1 to many expandables', () => {
   describe('request fields with filter', () => {
      it('requests through expandables', () => {
         const role = 'admin';
         let input = {
            fields: {
               firstname: true,
            },
            expandables: {
               course_application: {
                  fields: {
                     course_id: true,
                  },
                  expandables: {
                     course: {
                        fields: {
                           name: true,
                        },
                     },
                  },
               },
            },
         };

         const expected = getDefaultExpected(role);
         expected.fields.firstname = true;
         expected.expandables.courseApplication.fields.courseId = true;
         expected.expandables.courseApplication.expandables.course.fields.name = true;
         test(input, role, expected);
      });

      it('requests through expandables, try circular', () => {
         const role = 'admin';
         let input = {
            fields: {
               firstname: true,
            },
            expandables: {
               course_application: {
                  fields: {
                     course_id: true,
                  },
                  expandables: {
                     course: {
                        fields: {
                           name: true,
                        },
                     },
                     student: {
                        fields: {
                           firstname: true,
                        },
                     },
                  },
               },
            },
         };

         const expected = getDefaultExpected(role);
         expected.fields.firstname = true;
         expected.expandables.courseApplication.fields.courseId = true;
         expected.expandables.courseApplication.expandables.course.fields.name = true;
         test(input, role, expected);
      });

      it('requests existing fields with invalid filter', () => {
         const role = 'admin';
         let input = {
            fields: {
               firstname: true,
            },
            expandables: {
               country: {
                  fields: {
                     name: true,
                     timezone: true,
                  },
                  filters: {
                     timezone: {
                        operato: 'equals',
                        value: 'Europe/Paris',
                     },
                  },
               },
            },
         };

         const expected = getDefaultExpected(role);
         expected.fields.firstname = true;
         expected.expandables.country.fields.name = true;
         expected.expandables.country.fields.timezone = true;
         expected.errors = [
            {
               fieldName: 'timezone',
               reason: 'missing comparison operator for key [timezone]',
            },
         ];

         test(input, role, expected);
      });
   });
});
// it('requests existing fields', () => {
//    const input = {
//       fields: {
//          id: false,
//          name: true,
//          unknown_field: true,
//       },
//       filters: {
//          id: false,
//          name: 'eee',
//          unknown_field: 'eee',
//          status: 'Accepted',
//          outlet_id: '1dqdq',
//       },
//    };

//    const role = 'admin';
//    const sql = `SELECT service_mode.name
// FROM service_mode
// WHERE service_mode.name='eee'
// LIMIT 100`
//    test(input, role, sql);
// });
// const sql = `SELECT service_mode.name
// FROM service_mode
// WHERE service_mode.name='eee'
// LIMIT 100`

// test with options : limit, etc
// test with no fields but 1 expandable

interface Expected {
   fields: Tree;
   filters: Tree;
   options: {
      pagination: { offset: number; limit: number };
   };
   expandables: any;
   errors: Array<{ fieldName: string; reason: string }>;
}

function test(input: Tree, role: Role, expected: Expected) {
   const factory = getDomainRequestHandler('student');
   const res = factory.getRoleDomainRequestBuilder(role).build(input, []);
   // console.log('res:', JSON.stringify(res, null, 2));

   // const actualFieldsKeys = Object.keys(res.request.getFields()) as Array<keyof Fields>;
   // expect(actualFieldsKeys.length, 'fields length').to.equals(Object.keys(expected.fields).length);
   // for (const key of actualFieldsKeys) {
   //    expect(res.request.getFields()[key], `fields: ${key}`).to.equals(expected.fields[key]);
   // }

   // const actualFiltersKeys = Object.keys(res.request.getFilters()) as Array<keyof Fields>;
   // expect(actualFiltersKeys.length, 'filters length').to.equals(Object.keys(expected.filters).length);
   // for (const key of actualFiltersKeys) {
   //    expect(res.request.getFilters()[key], `filters: ${key}`).to.equals(expected.filters[key]);
   // }

   // expect(res.request.getOptions().limit).to.equals(expected.options.limit);
   compareRequestBuilder('student', res.request, expected);
   compareRequestBuilder('country', res.request.getExpandables().country, expected.expandables.country);
   compareRequestBuilder(
      'courseApplication',
      res.request.getExpandables().courseApplication,
      expected.expandables.courseApplication,
   );

   if (res.errors.length > 0) {
      // console.log('res.errors:', res.request);
      // console.log('res.errors:', res.errors);
   }
   expect(res.errors.length, 'error').to.equals(expected.errors.length);
   for (const err of res.errors) {
      const expectedErr = expected.errors.find((e) => e.fieldName === err.fieldName);
      expect(expectedErr).to.not.be.undefined;
      expect(err.reason, err.reason).to.equals(expectedErr?.reason);
   }
}

function compareRequestBuilder<F, Exp>(name: string, request: DomainRequest<string, F, Exp>, expected: Expected): void {
   const actualFieldsKeys = Object.keys(request.getFields()) as Array<keyof F>;
   expect(actualFieldsKeys.length, `${name} fields length`).to.equals(Object.keys(expected.fields).length);
   for (const key of actualFieldsKeys) {
      expect(request.getFields()[key], `${name} fields: ${key}`).to.equals(expected.fields[key]);
   }

   const actualFiltersKeys = Object.keys(request.getFilters()) as Array<keyof F>;
   expect(actualFiltersKeys.length, `${name} filters length`).to.equals(Object.keys(expected.filters).length);
   for (const key of actualFiltersKeys) {
      expect(request.getFilters()[key], `${name} filters: ${key}`).to.equals(expected.filters[key]);
   }

   expect(request.getOptions().pagination.limit).to.equals(expected.options.pagination.limit);
   expect(request.getOptions().pagination.offset).to.equals(expected.options.pagination.offset);

   const actualExpKeys = Object.keys(request.getExpandables()) as Array<keyof Exp>;
   expect(actualExpKeys.length, `${name} expandables length`).to.equals(Object.keys(expected.expandables).length);
   for (const key of actualExpKeys) {
      compareRequestBuilder(`${name} > ${key}`, request.getExpandables()[key], expected.expandables[key]);
      // expect(request.getFilters()[key], `${name} filters: ${key}`).to.equals(expected.filters[key]);
   }
}

function getDefaultExpected(role: Role, dontDoThese: string[] = []): Expected {
   const name = 'student';
   const factory = getDomainRequestHandler(name);
   const result = buildExpected(factory.getRoleDomainRequestBuilder(role));

   const countryBuilders = getDomainRequestHandler('country');
   if (!dontDoThese.includes('country')) {
      result.expandables.country = buildExpected(countryBuilders.getRoleDomainRequestBuilder(role));
   }
   if (!dontDoThese.includes('courseApplication')) {
      result.expandables.courseApplication = getCourseApplicationDefaultExpected(role, ['student']);
   }
   return result;
}

function getCourseApplicationDefaultExpected(role: Role, dontDoThese: string[]): Expected {
   const name = 'courseApplication';
   const factory = getDomainRequestHandler(name);
   const result = buildExpected(factory.getRoleDomainRequestBuilder(role));

   if (!dontDoThese.includes('course')) {
      result.expandables.course = getCourseDefaultExpected(role);
   }
   if (!dontDoThese.includes('student')) {
      result.expandables.student = getDefaultExpected(role, [...dontDoThese, name]);
   }
   return result;
}

function getCourseDefaultExpected(role: Role): Expected {
   const name = 'course';
   const factory = getDomainRequestHandler(name);
   const result = buildExpected(factory.getRoleDomainRequestBuilder(role));
   return result;
}

function buildExpected(requestBuilder: DomainRequestBuilder<DomainRequestName, any, any>): Expected {
   const defaultFields = requestBuilder.buildDefaultRequestableFields();

   return {
      fields: defaultFields,
      filters: {},
      options: { pagination: { offset: 0, limit: 100 } },
      expandables: {},
      errors: [],
   };
}

function replaceNewLineAndDoubleSpaces(v: string): string {
   return v
      .replace(new RegExp('\n', 'g'), ' ')
      .replace(new RegExp('   ', 'g'), ' ')
      .replace(new RegExp('  ', 'g'), ' ');
}

/*

TODO
test filtres
=> toutes les combinaison operator vs type
equals x string
equals x boolean
...


*/
