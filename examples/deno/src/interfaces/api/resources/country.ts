import { Context } from '/deps/index.ts';
import { fetch as genericFetch } from '../helpers.ts';
import { domainFetch } from '@controllers/country/index.ts';

export async function fetch(ctx: Context) {
   await genericFetch(ctx, domainFetch);
}
