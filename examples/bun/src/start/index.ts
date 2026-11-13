import { cors } from '@elysiajs/cors';
import { t } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { Router as Elysia, SelectMethod } from '/deps/index.ts';
import { buildInterfaces, getDatabaseConnector, plugRoutes } from '@interfaces/index.ts';
import { init as initDomainRequests } from '@app/index.ts';
import { ConfigFile } from '@domains/ConfigurationFile.ts';

export async function start(config: ConfigFile) {
   await buildInterfaces(config);

   const select: SelectMethod = (query, params) => getDatabaseConnector().query(query, params);
   initDomainRequests(select);

   const server = new Elysia()
      // .get('/', () => 'Hello World')
      .get(
         '/json',
         (ctx) => {
            ctx.set.status = 200;
            return new Response(JSON.stringify({ hello: 'world' }));
         },
         {
            params: t.Object({
               id: t.String(),
            }),
            query: t.Object({
               name: t.String(),
            }),
            body: t.Object({
               username: t.String(),
               password: t.String(),
            }),
            response: t.Object({
               username: t.String(),
               password: t.String(),
               id: t.String(),
               name: t.String(),
            }),
         },
      )
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
