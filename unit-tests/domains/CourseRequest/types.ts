import { DomainRequest, DomainResult, ExpandableName } from '../../../src';
import { DomainRequestName } from '../types';

export interface Fields {
   id: string;
   name: string;
}

export interface ExpandableFields {}

export const domainRequestName: DomainRequestName = 'course';
export const expandableNames: Array<ExpandableName<DomainRequestName, ExpandableFields>> = [];

export type Request = DomainRequest<DomainRequestName, Fields, ExpandableFields>;
export type Result = DomainResult;
