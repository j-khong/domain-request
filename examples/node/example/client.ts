import conf from '../conf.json';
import { QueryApi } from '../client/index.ts';
import { NodeExample } from '../client/NodeExample.ts';

(async () => {
   const url = `http://${conf.server.host}:${conf.server.port}`;
   console.log('calling url:', url);

   const apiConnector = new NodeExample(url);
   apiConnector.init({ token: 'security-is-not-set-up', role: 'admin' });
   const c = new QueryApi(apiConnector);

   console.log('fetching all countries with no specified fields: ', await c.fetchCountry({}));
   console.log('fetching countries with wanted fields: ', await c.fetchCountry({ fields: { name: true } }));
   console.log(
      'fetching countries with wanted fields & filters: ',
      await c.fetchCountry({ fields: { name: true }, filters: { name: { operator: 'contains', value: 'ran' } } }),
   );
})()
   .then()
   .catch((e) => console.error(e));
