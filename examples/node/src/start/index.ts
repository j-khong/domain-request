import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import { SelectMethod } from '@jkhong/domain-request';
import { ConfigFile } from '@domains/ConfigurationFile.ts';
import { buildInterfaces, getDatabaseConnector, plugRoutes } from '@interfaces/index.ts';
import { init as initDomainRequests } from '@app/index.ts';

const app = new Koa();
const router = new Router();

export async function start(config: ConfigFile): Promise<void> {
   await buildInterfaces(config);

   const select: SelectMethod = (query, params) => getDatabaseConnector().query(query, params);
   initDomainRequests(select);

   plugRoutes(router);
   app.use(cors());
   app.use(router.routes());
   app.use(router.allowedMethods());

   app.listen(config.server.port, () => {
      console.log(`Listening > ${config.server.host}:${config.server.port} ...`);
   });
}
