import { Context, helpers } from '/deps/index.ts';
import { getConfigFile } from '@interfaces/index.ts';

export function fetch(ctx: Context) {
   const config = getConfigFile();
   const resp = helpers.createResponse(ctx)
   helpers.setResponseBody(resp, {
      text: `Welcome to ${config.env} QUERY API v.${config.server.version}`,
      version: config.server.version,
      env: config.env,
   });
   helpers.setResponseStatus(resp, 200);
}
