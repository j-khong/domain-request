import { Router } from '/deps/index.ts';
import * as Root from './resources/root.ts';
import * as Country from './resources/country.ts';

export function plugRoutes(router: Router): void {
   router.get('/', Root.fetch);

   router.get('/countries', Country.fetch);
}
