import { DomainRequestName } from '../types';

export interface Fields {
   id: string;
   name: string;
   timezone: string;
}

export const domainRequestName: DomainRequestName = 'country';
