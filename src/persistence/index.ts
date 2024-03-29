import { DomainRequest, DomainResult } from '../domain-request/builder.ts';

export interface Persistence<Name extends string, T> {
   init: (settings: unknown) => void;
   fetch: (req: DomainRequest<Name, T>) => Promise<DomainResult>;
}
