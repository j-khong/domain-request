import { assertEquals /*, assertStrictEquals, assertThrows*/ } from 'https://deno.land/std@0.149.0/testing/asserts.ts';
import { getDomainRequestHandler } from '../domain-requests/init.ts';
import { DomainRequestName, Role } from '../domain-requests/types.ts';

export interface Expected {
   total: number;
   results: any[];
}

export async function test(
   input: any,
   role: Role,
   domainRequestName: DomainRequestName,
   expected: Expected,
): Promise<void> {
   const handler = getDomainRequestHandler(domainRequestName);
   const domainRequestBuilder = handler.getRoleDomainRequestBuilder(role);
   const buildResult = domainRequestBuilder.build(input);
   const result = await handler.fetchDomain(buildResult.request);

   assertEquals(result.domainName, domainRequestName);
   assertEquals(result.total, expected.total);
   assertEquals(result.results, expected.results);
}
