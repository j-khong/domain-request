export type QueryResult = {
   total: number;
   results: unknown[];
   errors: string[];
} | Error;
