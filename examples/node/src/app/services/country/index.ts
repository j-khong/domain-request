import { DomainRequest, InputErrors, Report } from "@jkhong/domain-request";
import { DomainRequestName, Role } from '@domains/types';
import { User } from '@domains/User';
import { domainFetch as genericDomainFetch } from '@app/helpers';
import { Fields } from './dr';
import { domainRequestName } from './dr/types';


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
