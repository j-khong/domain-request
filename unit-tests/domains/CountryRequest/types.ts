import { ExpandableName } from '../../../src';
import { DomainRequestName } from '../types';

export interface Fields {
   id: string;
   name: string;
   timezone: string;
}

export interface ExpandableFields {}

export const domainRequestName: DomainRequestName = 'country';
export const expandableNames: Array<ExpandableName<DomainRequestName, ExpandableFields>> = [];
