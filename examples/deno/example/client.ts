import conf from '../conf.json' assert { type: 'json' };
import { QueryApi } from '../client/index.ts';

const url = `http://${conf.server.host}:${conf.server.port}`;
const c = new QueryApi(url);
c.init({ token: 'security-is-not-set-up', role: 'admin' });

console.log(await c.fetchCountry({}));
console.log(
   await c.fetchCountry({ fields: { name: true }, filters: { name: { operator: 'contains', value: 'ran' } } }),
);
