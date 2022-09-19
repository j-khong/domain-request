import { init, getDomainRequestHandler } from './domain-requests/init.ts';
import { DomainRequestName, Role } from './domain-requests/types.ts';
import { resetClient } from './persistence/database/dbUtils.ts';

init();
let domain: DomainRequestName = 'course';
let role: Role = 'student';

const req = {
   fields: {
      // name: true,
      max_seats: true,
      // status: true,
   },
   // filters: { name: { operator: 'equals', value: 'Arts' } },
   // filters: { status: { operator: 'equals', value: 'closed' } },
   filters: {
      // or: [{ name: { operator: 'equals', value: 'Arts' } }, { name: { operator: 'equals', value: 'History' } }],
   },
   //
   // building
   //
   // fields: {
   //    // id: true,
   //    name: true,
   //    // type: {
   //    //    name: true,
   //    // },
   //    // architect: {
   //    //    name: true,
   //    //    rating: { rate: true, rater: { name: true } },
   //    // },
   //    // status: true,
   //    // sponsors: {
   //    //    id: true,
   //    //    name: true,
   //    //    // x: true,ù
   //    // },
   //    // opening_hours: {
   //    //    day: true,
   //    //    // other2: true,
   //    //    slots: {
   //    //       // ee: true,
   //    //       start: true,
   //    //       end: true,
   //    //    },
   //    // },
   //    // other: true,
   //    // pictures: {
   //    //    url: true,
   //    //    name: true,
   //    //    // eee: true,
   //    // },
   // },
   // filters: {
   //    // id: { operator: 'equals', value: 'e' },
   //    id: { operator: 'equals', value: ['e', 'z'] },
   //    // sponsors: {
   //    //    operator: 'contains',
   //    //    value: ['e', 'z'],
   //    // }, // this one does not work
   //    // sponsors: { name: { operator: 'contains', value: ['e', 'z'] } },
   //    opening_hours: {
   //       // dkd: { operator: 'equals', value: ['e', 'z'] },
   //       slots: {
   //          start: { operator: 'equals', value: ['e', 'z'] },
   //       },
   //    },
   // },
   // options: { limit: 1 },
};

const domainHandler = getDomainRequestHandler(domain);
const roleHandler = domainHandler.getRoleDomainRequestBuilder(role);

const res = roleHandler.build(req);
// console.log('res:', JSON.stringify(res, null, 2));

if (res.errors.length > 0) {
   console.log('build:', JSON.stringify(res.errors, null, 2));
}

domainHandler
   .fetchDomain(res.request)
   .then((dateResult) => {
      console.log('dateResult:', JSON.stringify(dateResult, null, 2));
   })
   .catch((e) => console.log(e))
   .finally(async () => await resetClient());
