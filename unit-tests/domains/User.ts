import { DomainUser } from '../../src/DomainRequest';

export type Role = 'admin'; //| 'restricted';
export class User extends DomainUser {
   constructor(private readonly role: Role) {
      super();
   }

   getRole(): Role {
      return this.role;
   }
}
