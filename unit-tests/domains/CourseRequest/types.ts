import { DomainRequest, DomainResult } from '../../../src';
import { DomainRequestName } from '../types';

export interface Fields {
   id: string;
   name: string;
}

export interface ExpandableFields {}

export type Request = DomainRequest<DomainRequestName, Fields, ExpandableFields>;

export type Result = DomainResult;
