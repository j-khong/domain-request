import { Context } from '/deps/index.ts';
import { getConfigFile } from '../../index.ts';

export function fetch(ctx: Context) {
   const config = getConfigFile();
   ctx.response.body = {
      text: `Welcome to ${config.env} QUERY API v.${config.server.version}`,
      version: config.server.version,
      env: config.env,
   };
   ctx.response.status = 200;
}
