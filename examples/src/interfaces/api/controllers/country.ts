import { Context } from '/deps/index.ts';
import { domainFetch } from '@services/country/index.ts';
import { fetch as genericFetch } from '../helpers.ts';

export async function fetch(ctx: Context) {
   return genericFetch(ctx, domainFetch);
}
