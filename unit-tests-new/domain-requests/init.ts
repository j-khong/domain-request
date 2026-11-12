// the same tests run against the domains declared with the deprecated api, or with the new one
import * as oldApi from '../domain-requests-old/init.ts';
import * as newApi from '../domain-requests-new/init.ts';

const api = Deno.env.get('UNIT_TESTS_API') === 'new' ? newApi : oldApi;

export const init = api.init;
export const getDomainRequestHandler = api.getDomainRequestHandler;
