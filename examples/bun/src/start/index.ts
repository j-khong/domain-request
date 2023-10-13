import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { Router as Elysia, SelectMethodResult } from '/deps/index.ts';
import { buildInterfaces, getDatabaseConnector, plugRoutes } from '@interfaces/index.ts';
import { init as initDomainRequests } from '@app/index.ts';
import { ConfigFile } from '@domains/ConfigurationFile.ts';

export async function start(config: ConfigFile) {
   await buildInterfaces(config);

   initDomainRequests(
      (query: string): Promise<SelectMethodResult> => {
         return getDatabaseConnector().query(query);
      },
   );

   const server = new Elysia()
      // .get('/', () => 'Hello World')
      .get('/json', (ctx) => {
         ctx.set.status = 200;
         return new Response(JSON.stringify({ hello: 'world' }));
      })
      .onParse(({ request }, contentType) => {
         if (contentType === 'application/json') {
            return request.text();
         }
      });

   plugRoutes(server);
   server.use(cors()).use(swagger());
   const port = config?.server.port;
   server.listen(port, () => console.log(`Listening > ${config.server.host}:${config.server.port} ...`));
}
