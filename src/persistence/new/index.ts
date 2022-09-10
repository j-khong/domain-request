import { DomainRequest, DomainResult } from '../../DomainRequest/new/builder.ts';

export interface Persistence<Name extends string, T> {
   init: (settings: unknown) => void;
   fetch: (req: DomainRequest<Name, T>) => Promise<DomainResult>;
}
