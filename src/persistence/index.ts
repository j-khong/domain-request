export type DomainResult = {
   domainName: string;
   results: any[];
   report: Report;
   total: number;
};

export class Report {
   public readonly requests: Array<{
      sql: string;
      timeInMs: number;
   }> = [];
}
