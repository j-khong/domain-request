import { Application, oakCors, Router, SelectMethodResult } from '/deps/index.ts';
import { ConfigFile } from '@domains/ConfigurationFile.ts';
import { buildInterfaces, getDatabaseConnector, plugRoutes } from '/interfaces/index.ts';
import { init as initDomainRequests } from '/app/index.ts';

const app = new Application();
const router = new Router();

export async function start(config: ConfigFile): Promise<void> {
   await buildInterfaces(config);

   initDomainRequests((query: string): Promise<SelectMethodResult> => {
      return getDatabaseConnector().query(query);
   });

   plugRoutes(router);

   app.use(oakCors());
   app.use(router.routes());
   app.use(router.allowedMethods());

   console.log(`Listening > ${config.server.host}:${config.server.port} ...`);
   await app.listen(`${config.server.host}:${config.server.port}`);
}
