import 'mocha';
import { expect, assert } from 'chai';
import { getRoleRequestBuilder } from './domains/StudentRequest/builder';
import { User } from './domains/User';
// import { generateSQL } from './persistence/ServiceMode';
import { Tree } from '../src/DomainRequest';

import { init } from './domains/init';

init();
describe('request fields on simple domain', () => {
   describe('request fields only', () => {
      it('requests 1 existing field', () => {
         const user = new User('admin');
         let input = {
            fields: {
               id: true,
            },
         };

         const expected = {
            fields: {
               id: true,
               firstname: false,
               lastname: false,
               yearOfBirth: false,
               nationalCardId: false,
               countryId: false,
            },
            filters: {},
            options: {},
            expandables: {},
            errors: {},
         };
         test(input, user, expected);

         input = {
            fields: {
               id: 1,
            },
         } as any;
         test(input, user, expected);
      });

      //       it('requests 2 existing fields to show', () => {
      //          const user = new User('admin');
      //          const input = {
      //             fields: {
      //                id: true,
      //                name: true,
      //             },
      //          };

      //          const sql = `SELECT service_mode.id AS service_mode$id, service_mode.name AS service_mode$name
      // FROM service_mode
      // LIMIT 100`;
      //          test(input, user, sql);
      //       });

      //       it('requests 2 existing fields : 1 to show, 1 not to', () => {
      //          const user = new User('admin');
      //          const input = {
      //             fields: {
      //                id: false,
      //                name: true,
      //             },
      //          };

      //          const sql = `SELECT service_mode.name AS service_mode$name
      // FROM service_mode
      // LIMIT 100`;
      //          test(input, user, sql);
      //       });

      //       it('requests 1 existing fields and 1 unknown', () => {
      //          const user = new User('admin');
      //          let input = {
      //             fields: {
      //                name: true,
      //                unknown_field: true,
      //             },
      //          };

      //          const sql = `SELECT service_mode.name AS service_mode$name
      // FROM service_mode
      // LIMIT 100`;
      //          test(input, user, sql);

      //          input = {
      //             fields: {
      //                name: true,
      //                unknown_field: false,
      //             },
      //          };
      //          test(input, user, sql);
      //       });

      //       it('requests 1 unknown', () => {
      //          const user = new User('admin');
      //          let input = {
      //             fields: {
      //                unknown_field: true,
      //             },
      //          };

      //          const sql = undefined;
      //          test(input, user, sql);
      //       });

      //       it('requests nothing', () => {
      //          const user = new User('admin');
      //          const input = {
      //             fields: {},
      //          };

      //          const sql = undefined;
      //          test(input, user, sql);
      //       });
   });

   //    describe('request filters only', () => {
   //       it('requests nothing', () => {
   //          const user = new User('admin');
   //          const input = {
   //             fields: {},
   //             filters: {
   //                name: 'onsite',
   //             },
   //          };

   //          const sql = undefined;
   //          test(input, user, sql);
   //       });
   //    });

   //    describe('request fields with filters', () => {
   //       it('requests with incorrect filter', () => {
   //          const user = new User('admin');
   //          const input = {
   //             fields: {
   //                id: false,
   //                name: true,
   //                unknown_field: true,
   //             },
   //             filters: {
   //                name: 'onsite',
   //                unknown_field: 'onsite',
   //             },
   //          };

   //          const sql = `SELECT service_mode.name AS service_mode$name
   // FROM service_mode
   // LIMIT 100`;
   //          test(input, user, sql, 'expectedErrors');
   //       });
   //       it('requests with incorrect filter (missing comparator operator)', () => {
   //          const user = new User('admin');
   //          const input = {
   //             fields: {
   //                id: false,
   //                name: true,
   //                unknown_field: true,
   //             },
   //             filters: {
   //                name: { value: 'onsite' },
   //                unknown_field: 'onsite',
   //             },
   //          };

   //          const sql = `SELECT service_mode.name AS service_mode$name
   // FROM service_mode
   // LIMIT 100`;
   //          test(input, user, sql, 'expectedErrors');
   //       });
   //       it('requests with incorrect filter (missing comparator value)', () => {
   //          const user = new User('admin');
   //          const input = {
   //             fields: {
   //                id: false,
   //                name: true,
   //                unknown_field: true,
   //             },
   //             filters: {
   //                name: { operator: 'equals' },
   //                unknown_field: 'onsite',
   //             },
   //          };

   //          const sql = `SELECT service_mode.name AS service_mode$name
   // FROM service_mode
   // LIMIT 100`;
   //          test(input, user, sql, 'expectedErrors');
   //       });
   //       it('requests with incorrect filter (invalid comparator operator)', () => {
   //          const user = new User('admin');
   //          const input = {
   //             fields: {
   //                id: false,
   //                name: true,
   //                unknown_field: true,
   //             },
   //             filters: {
   //                name: { operator: 'equal', value: 'onsite' },
   //                unknown_field: 'onsite',
   //             },
   //          };

   //          const sql = `SELECT service_mode.name AS service_mode$name
   // FROM service_mode
   // LIMIT 100`;
   //          test(input, user, sql, 'expectedErrors');
   //       });
   //       it('requests with correct equals filter', () => {
   //          const user = new User('admin');
   //          const input = {
   //             fields: {
   //                id: false,
   //                name: true,
   //                unknown_field: true,
   //             },
   //             filters: {
   //                name: { operator: 'equals', value: 'onsite' },
   //                unknown_field: 'onsite',
   //             },
   //          };

   //          const sql = `SELECT service_mode.name AS service_mode$name
   // FROM service_mode
   // WHERE service_mode.name='onsite'
   // LIMIT 100`;
   //          test(input, user, sql, 'expectedErrors');
   //       });
   //       it('requests with correct contains filter', () => {
   //          const user = new User('admin');
   //          const input = {
   //             fields: {
   //                id: false,
   //                name: true,
   //                unknown_field: true,
   //             },
   //             filters: {
   //                name: { operator: 'contains', value: 'onsite' },
   //                unknown_field: 'onsite',
   //             },
   //          };

   //          const sql = `SELECT service_mode.name AS service_mode$name
   // FROM service_mode
   // WHERE service_mode.name LIKE '%onsite%'
   // LIMIT 100`;
   //          test(input, user, sql, 'expectedErrors');
   //       });
   //    });

   //    describe('request fields with options', () => {
   //       it('requests with defined limit', () => {
   //          const user = new User('admin');
   //          const input = {
   //             fields: {
   //                id: false,
   //                name: true,
   //                unknown_field: true,
   //             },
   //             options: {
   //                limit: 10,
   //             },
   //          };

   //          const sql = `SELECT service_mode.name AS service_mode$name
   // FROM service_mode
   // LIMIT 10`;
   //          test(input, user, sql, 'expectedErrors');
   //       });
   //       it('requests with defined over max limit', () => {
   //          const user = new User('admin');
   //          const input = {
   //             fields: {
   //                id: false,
   //                name: true,
   //                unknown_field: true,
   //             },
   //             options: {
   //                limit: 10000,
   //             },
   //          };

   //          const sql = `SELECT service_mode.name AS service_mode$name
   // FROM service_mode
   // LIMIT 5000`;
   //          test(input, user, sql, 'expectedErrors');
   //       });
   //    });
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

//    const user = new User('admin');
//    const sql = `SELECT service_mode.name
// FROM service_mode
// WHERE service_mode.name='eee'
// LIMIT 100`
//    test(input, user, sql);
// });
// const sql = `SELECT service_mode.name
// FROM service_mode
// WHERE service_mode.name='eee'
// LIMIT 100`

//
//

// test with options : limit, etc
// test with no fields but 1 expandable

function test(
   input: Tree,
   user: User,
   expected: {
      fields: Tree;
      filters: Tree;
      options: Tree;
      expandables: Tree;
      errors: Tree;
   },
) {
   const builder = getRoleRequestBuilder('admin');
   const res = builder.build(input, []);

   expect(Object.keys(res.request.getFields()).length).to.equals(Object.keys(expected.fields).length);

   // if (expected === undefined) {
   //    expect(req).to.be.undefined;
   //    return;
   // }
   // expect(req).not.to.be.undefined;
   // if (req !== undefined) {
   //    expect(replaceNewLineAndDoubleSpaces(req.results)).to.equal(replaceNewLineAndDoubleSpaces(expected));
   // }
}

function replaceNewLineAndDoubleSpaces(v: string): string {
   return v
      .replace(new RegExp('\n', 'g'), ' ')
      .replace(new RegExp('   ', 'g'), ' ')
      .replace(new RegExp('  ', 'g'), ' ');
}
