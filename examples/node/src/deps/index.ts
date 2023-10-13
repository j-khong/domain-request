import { Context } from 'koa';
export { Context } from 'koa';
import Router from '@koa/router';
export { Router };
export { z } from 'zod';
export * from '@jkhong/domain-request';

export const helpers = {
   getQuery: (ctx: Context): { query: string } => ctx.request.query as { query: string },
   getHeader: (ctx: Context, name: string): string | undefined => ctx.request.headers[name] as string,
   createResponse: (ctx: Context): Context['response'] => ctx.response,
   setResponseBody: (resp: Context['response'], body: Context['response']['body']) => (resp.body = body),
   setResponseStatus: (resp: Context['response'], status: number) => (resp.status = status),
};
