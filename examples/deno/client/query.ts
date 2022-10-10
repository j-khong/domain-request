type QueryResult = { total: number; results: unknown[]; errors: string[] } | Error;
class QueryApi {
   private readonly token: string;
   private readonly url: string;
   private readonly role: string;
   constructor(v: { token: string; url: string; role: string }) {
      this.url = v.url;
      this.token = v.token;
      this.role = v.role;
   }

   getCountry(query: unknown): Promise<QueryResult> {
      const resource = 'countries';
      return this.doQuery(resource, query);
   }

   private doQuery(
      resource: string,
      query: unknown,
   ): Promise<{ total: number; results: unknown[]; errors: string[] } | Error> {
      const q = new URLSearchParams({
         query: JSON.stringify(query),
      });
      const url = `${this.url}/${resource}/?${q}`;
      // console.log('url:', url);

      const request = new Request(url, {
         method: 'GET',
         headers: this.buildHeaders(),
      });

      return fetch(request).then(async (res) => {
         // console.log('res:', res);
         const json = await res.json();

         if (json.message !== undefined) {
            return new Error(json.message);
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

      headers.append('Authorization', `Bearer ${this.token}`);
      headers.append('user-role', this.role);
      return headers;
   }
}
const processResult = (r: QueryResult) => {
   if (r instanceof Error) {
      console.error(r.message);
      return;
   }

   console.log(JSON.stringify(r, null, 2));
};

const role = 'admin';
const token = 'c3cfc7638707269596dcce50c43a9e40';
const url = `http://localhost:8080`;

const queryApi = new QueryApi({ token, role, url });

const countriesQuery = {
   fields: { name: true },
};

queryApi.getCountry(countriesQuery).then(processResult);
