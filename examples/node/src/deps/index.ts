import { Context } from 'koa';
export { Context } from 'koa';
import Router from '@koa/router';
export { Router };
export { z } from 'zod';
export * from '@jkhong/domain-request';

export const helpers = {
   getQuery: (ctx: Context): { query: string } => ctx.request.query as { query: string },
   getHeader: (ctx: Context, name: string): string | undefined => ctx.request.headers[name] as string,
};
