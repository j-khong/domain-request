import conf from '../conf.json' assert { type: 'json' };
import { QueryApi } from '../client/index.ts';

const url = `http://${conf.server.host}:${conf.server.port}`;
console.log('calling url:', url);
const c = new QueryApi(url);
c.init({ token: 'security-is-not-set-up', role: 'admin' });

console.log('fetching all countries with no specified fields: ', await c.fetchCountry({}));
console.log(
   'fetching countries with wanted fields: ',
   await c.fetchCountry({ fields: { name: true } }),
);
console.log(
   'fetching countries with wanted fields & filters: ',
   await c.fetchCountry({ fields: { name: true }, filters: { name: { operator: 'contains', value: 'ran' } } }),
);
