import { helpers as oakHelpers, Context } from 'https://deno.land/x/oak@v10.6.0/mod.ts';
export { Application, Context, Router } from 'https://deno.land/x/oak@v10.6.0/mod.ts';
export { oakCors } from 'https://deno.land/x/cors@v1.2.2/mod.ts';
import * as Path from 'https://deno.land/std@0.177.0/path/mod.ts';
export { Path };
export { z } from 'https://deno.land/x/zod@v3.21.4/mod.ts';
export { Client as MySqlClient, configLogger } from 'https://deno.land/x/mysql@v2.10.2/mod.ts';
export { DB as SqliteClient } from 'https://deno.land/x/sqlite@v3.7.0/mod.ts';

// the library sources of this repository
export * from '../../../../src/index.ts';
export * from '../../../../src/tools.ts';

export const helpers = {
   getQuery: oakHelpers.getQuery,
   getHeader: (ctx: Context, name: string) => ctx.request.headers.get(name),
   createResponse: (ctx: Context, body: Context['response']['body'], status: number): Response => {
      ctx.response.body = body;
      ctx.response.status = status;
      return ctx.response;
   },
};

export type Response = Context['response'];
