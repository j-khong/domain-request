import { DomainRequestName } from '../types';

export const domainRequestName: DomainRequestName = 'country';

export interface Fields {
   id: string;
   name: string;
   timezone: string;
}
