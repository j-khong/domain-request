import { helpers as oakHelpers, Context } from 'https://deno.land/x/oak@v10.6.0/mod.ts';
export { Application, Context, Router } from 'https://deno.land/x/oak@v10.6.0/mod.ts';
export { oakCors } from 'https://deno.land/x/cors@v1.2.2/mod.ts';
import * as Path from 'https://deno.land/std/path/mod.ts';
export { Path };
export { z } from 'https://deno.land/x/zod/mod.ts';
export { Client as MySqlClient, configLogger } from 'https://deno.land/x/mysql@v2.10.2/mod.ts';
export { DB as SqliteClient } from 'https://deno.land/x/sqlite/mod.ts';

export * from 'https://deno.land/x/domain_request@0.7.0/src/index.ts';

export const helpers = {
   getQuery: oakHelpers.getQuery,
   getHeader: (ctx: Context, name: string) => ctx.request.headers.get(name),
   createResponse: (ctx: Context): Context['response'] => ctx.response,
   setResponseBody: (resp: Context['response'], body: Context['response']['body']) => (resp.body = body),
   setResponseStatus: (resp: Context['response'], status: number) => (resp.status = status),
};
