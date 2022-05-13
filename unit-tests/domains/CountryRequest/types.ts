import { DomainRequest } from '../../../src/DomainRequest';

export interface Fields {
   id: string;
   name: string;
   timezone: string;
}

export interface ExpandableFields {}

export type Request = DomainRequest<Fields, ExpandableFields>;

export type Result = {};
