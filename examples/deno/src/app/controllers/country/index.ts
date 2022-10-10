import { DomainRequest, InputErrors, Report } from '/deps/index.ts';
import { DomainRequestName, Role } from '/app/domains/types.ts';
import { Fields } from './dr/index.ts';
import { domainFetch as genericDomainFetch } from '/app/helpers.ts';
import { User } from '/app/domains/User.ts';
import { domainRequestName } from './dr/types.ts';

export function domainFetch(
   inputData: unknown,
   userData: { token: string; role: Role },
): Promise<{ total: number; results: unknown[]; errors: InputErrors; persistenceReport: Report }> {
   const modifyRequest = (user: User, dr: DomainRequest<DomainRequestName, Fields>) => {
      switch (user.role) {
         case 'admin':
            // all rights
            return;
         case 'student':
            return restrictToStudentId(dr, user.id);
         default:
            // dont allow to fetch data
            return restrictToStudentId(dr, '0');
      }
   };
   return genericDomainFetch(inputData, userData, domainRequestName, modifyRequest);
}

function restrictToStudentId(dr: DomainRequest<DomainRequestName, Fields>, studentId: string): void {
   // dr.filters.and.push({
   //    studentId: {
   //       operator: 'equals',
   //       value: studentId,
   //    },
   // });
}
