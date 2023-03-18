import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import {  SelectMethodResult } from '@jkhong/domain-request';
import { ConfigFile } from '@domains/ConfigurationFile';
import { buildInterfaces, getDatabaseConnector, plugRoutes } from '@interfaces/index';
import { init as initDomainRequests } from '@app/index';

const app = new Koa();
const router = new Router();

export async function start(config: ConfigFile): Promise<void> {
   await buildInterfaces(config);

   initDomainRequests((query: string): Promise<SelectMethodResult> => {
      return getDatabaseConnector().query(query);
   });

   plugRoutes(router);
   app.use(cors());
   app.use(router.routes());
   app.use(router.allowedMethods());

   app.listen(config.server.port, () => {
      console.log(`Listening > ${config.server.host}:${config.server.port} ...`);
   });
}
