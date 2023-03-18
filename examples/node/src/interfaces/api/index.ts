import { Context } from 'koa';
import Router from '@koa/router';
import { DomainRequestName } from '/app/domains/types';
import * as Root from './controllers/root';
import * as Country from './controllers/country';
import * as Architect from './controllers/architect';

const mapping: Array<{ resource: string; drn: DomainRequestName; fetch: (ctx: Context) => void }> = [
   { resource: 'countries', drn: 'country', fetch: Country.fetch },
   { resource: 'architects', drn: 'architect', fetch: Architect.fetch },
];

export function plugRoutes(router: Router): void {
   router.get('/', Root.fetch);

   for (const entry of mapping) {
      router.get(`/${entry.resource}`, entry.fetch);
   }
}

export function getResourceDomainMapping() {
   return mapping.map((m) => {
      return {
         resource: m.resource,
         drn: m.drn,
      };
   });
}
