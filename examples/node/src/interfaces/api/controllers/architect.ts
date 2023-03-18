import { Context } from 'koa';
import { domainFetch } from '@services/architect';
import { fetch as genericFetch } from '../helpers';

export async function fetch(ctx: Context) {
   await genericFetch(ctx, domainFetch);
}
