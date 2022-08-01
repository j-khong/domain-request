import { DomainRequestName } from '../types.ts';

export const domainRequestName: DomainRequestName = 'country';

export interface Fields {
   id: string;
   name: string;
   timezone: string;
}
