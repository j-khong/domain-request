import { Role } from './domains/Role.ts';
import { ApiConnection } from './ApiConnection.ts';

export class DenoExample extends ApiConnection {
   private token?: string;
   private role?: Role;
   constructor(url: string) {
      super(url);
   }

   init(v: { token: string; role: Role }) {
      this.token = v.token;
      this.role = v.role;
   }

   fetch(url: string): Promise<string> {
      const request = new Request(url, {
         method: 'GET',
         headers: this.buildHeaders(),
      });

      return fetch(request).then((res) => res.text());
   }

   private buildHeaders(): Headers {
      const headers = new Headers({
         'Cache-Control': 'no-cache, no-store, must-revalidate',
         Pragma: 'no-cache',
         Expires: '0',
         Accept: 'application/json',
         'Content-Type': 'application/json',
      });

      if (this.token === undefined || this.role === undefined) {
         throw new Error('please init Query API connector with token and user role');
      }
      headers.append('Authorization', `Bearer ${this.token}`);
      headers.append('user-role', this.role);
      return headers;
   }
}
