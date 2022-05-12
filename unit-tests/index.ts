import 'mocha';
import { expect, assert } from 'chai';
import { getRoleRequestBuilder, Fields } from './domains/StudentRequest';
import { RequestableFields, Tree } from '../src/DomainRequest';

import { init } from './domains/init';
import { Role } from './domains/User';

init();
describe('request fields on simple domain', () => {
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
               id: true,
               firstname: true,
            },
         };

         const expected = getDefaultExpected(role);
         expected.fields.id = true;
         expected.fields.firstname = true;

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
         expected.options.limit = 10;
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
         expected.options.limit = 5000;
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

//
//

// test with options : limit, etc
// test with no fields but 1 expandable

interface Expected {
   fields: Tree;
   filters: Tree;
   options: Tree;
   expandables: Tree;
   errors: Array<{ fieldName: string; reason: string }>;
}

function test(input: Tree, role: Role, expected: Expected) {
   const builder = getRoleRequestBuilder(role);
   const res = builder.build(input, []);
   // console.log('res:', res);

   const actualFieldsKeys = Object.keys(res.request.getFields()) as Array<keyof Fields>;
   expect(actualFieldsKeys.length, 'fields length').to.equals(Object.keys(expected.fields).length);
   for (const key of actualFieldsKeys) {
      expect(res.request.getFields()[key], `fields: ${key}`).to.equals(expected.fields[key]);
   }

   const actualFiltersKeys = Object.keys(res.request.getFilters()) as Array<keyof Fields>;
   expect(actualFiltersKeys.length, 'filters length').to.equals(Object.keys(expected.filters).length);
   for (const key of actualFiltersKeys) {
      expect(res.request.getFilters()[key], `filters: ${key}`).to.equals(expected.filters[key]);
   }

   expect(res.request.getOptions().limit).to.equals(expected.options.limit);

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

function getDefaultExpected(role: Role): Expected {
   const defaultFields = getRoleRequestBuilder(role).buildDefaultRequestableFields();
   return {
      fields: defaultFields,
      filters: {},
      options: { limit: 100 },
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
