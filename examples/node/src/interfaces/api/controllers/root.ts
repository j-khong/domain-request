import {  Context } from 'koa';
import { getConfigFile } from '@interfaces/index';

export function fetch(ctx: Context) {
   const config = getConfigFile();
   ctx.response.body = {
      text: `Welcome to ${config.env} QUERY API v.${config.server.version}`,
      version: config.server.version,
      env: config.env,
   };
   ctx.response.status = 200;
}
