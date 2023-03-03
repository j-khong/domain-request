import { GenericError } from './domains/Error{EXT}';
import { Role } from './domains/Role{EXT}';
import { QueryResult } from './domains/QueryResult{EXT}';

export class Query {
   private token?: string;
   private role?: Role;
   constructor(private readonly url: string) {}

   init(v: { token: string; role: Role }) {
      this.token = v.token;
      this.role = v.role;
   }

   process(
      resource: string,
      query: unknown,
   ): Promise<QueryResult> {
      const q = new URLSearchParams({
         query: JSON.stringify(query),
      });
      const url = `${this.url}/${resource}/?${q}`;

      const request = new Request(url, {
         method: 'GET',
         headers: this.buildHeaders(),
      });

      return fetch(request).then(async (res) => {
         const json = await res.json();

         if (json.message !== undefined) {
            const err = GenericError.unserialize(json);
            if (err === undefined) {
               return new Error(json.message);
            } else {
               return err;
            }
         }
         return json;
      });
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
         throw new Error(
            'please init Query API connector with token and user role',
         );
      }
      headers.append('Authorization', `Bearer ${this.token}`);
      headers.append('user-role', this.role);
      return headers;
   }
}
