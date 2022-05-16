import { DomainRequest } from '../../../src/DomainRequest';

export interface Fields {
   id: string;
   name: string;
}

export interface ExpandableFields {}

export type Request = DomainRequest<Fields, ExpandableFields>;

export type Result = {};
