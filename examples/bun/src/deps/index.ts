import { Elysia, Context} from 'elysia';
export {type Context } from 'elysia';
export { Elysia as Router}

export { z } from 'zod';

export * from '@jkhong/domain-request';


export const helpers = {
    getQuery: (ctx: Context): { query: string } => ctx.query as { query: string },
    getHeader: (ctx: Context, name: string): string | undefined => {
        const v = ctx.request.headers.get(name)
        return v === null ? undefined : v
    },
    createResponse: (ctx: Context, body: any, status: number): Response => {
        const response = new Response(JSON.stringify(body))
        ctx.set.status = status;
        return response;
     }
 };
 