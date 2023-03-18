import { DomainRequest, InputErrors, Report } from '@jkhong/domain-request';
import { DomainRequestName, Role } from '@domains/types';
import { User } from '@domains/User';
import { getDomainRequestHandler } from './';

export const dumbModifyRequest: <DF>(user: User, dr: DomainRequest<DomainRequestName, DF>) => void = <DF>(
   _user: User,
   _dr: DomainRequest<DomainRequestName, DF>,
) => {};

export async function domainFetch<DF>(
   inputData: unknown,
   userData: { token: string; role: Role },
   domainName: DomainRequestName,
   modifyRequest: (user: User, dr: DomainRequest<DomainRequestName, DF>) => void,
): Promise<{ total: number; results: unknown[]; errors: InputErrors; persistenceReport: Report }> {
   const user = await fetchUser(userData);

   const handler = getDomainRequestHandler<DF>(domainName);
   const domainRequestBuilder = handler.getRoleDomainRequestBuilder(user.role);

   const buildResult = domainRequestBuilder.build(inputData);

   modifyRequest(user, buildResult.request);

   const dataResult = await handler.fetchDomain(buildResult.request);

   return {
      total: dataResult.total,
      results: dataResult.results,
      errors: buildResult.errors,
      persistenceReport: dataResult.report,
   };
}

function fetchUser(user: { token: string; role: Role }): Promise<User> {
   // TODO : fetch from your DB the user matching the auth token
   const { role } = user;

   switch (role) {
      case 'admin': {
         return Promise.resolve({ id: '0', role });
      }

      case 'student': {
         return Promise.resolve({ id: '0', role });
      }

      default:
         throw new Error(`unmanaged role [${role}]`);
   }
}
