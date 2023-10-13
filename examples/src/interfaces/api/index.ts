import { Context, Router } from '/deps/index.ts';
import { DomainRequestName } from '@domains/types.ts';
import * as Root from './controllers/root.ts';
import * as Country from './controllers/country.ts';
import * as Architect from './controllers/architect.ts';

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
