import { expect } from 'chai';
import { getDomainRequestHandler } from '../domain-requests/init';
import { DomainRequestName, Role } from '../domain-requests/types';

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

   expect(result.domainName).to.equals(domainRequestName);
   expect(result.total).to.equals(expected.total);
   expect(result.results).to.deep.equals(expected.results);
}
