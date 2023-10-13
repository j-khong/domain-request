import { Context, helpers } from '/deps/index.ts';
import { getConfigFile } from '@interfaces/index.ts';

export async function fetch(ctx: Context) {
   const config = getConfigFile();

   const status = 200;
   const body = {
      text: `Welcome to ${config.env} QUERY API v.${config.server.version}`,
      version: config.server.version,
      env: config.env,
   };
   return helpers.createResponse(ctx, body, status);
}
