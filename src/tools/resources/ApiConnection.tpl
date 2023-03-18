import { GenericError } from './domains/Error{EXT}';
import { QueryResult } from './domains/QueryResult{EXT}';

export abstract class ApiConnection {
   abstract fetch(url: string): Promise<string>;

   constructor(protected readonly url: string) {}

   async process(resource: string, query: unknown): Promise<QueryResult> {
      const q = new URLSearchParams({
         query: JSON.stringify(query),
      });
      const url = `${this.url}/${resource}/?${q}`;

      const res = await this.fetch(url);
      const json = JSON.parse(res);

      if (json.message !== undefined) {
         const err = GenericError.unserialize(json);
         if (err === undefined) {
            return new Error(json.message);
         } else {
            return err;
         }
      }
      return json;
   }
}
