import { ExpandableName } from '../../../src';
import { isString } from '../../../src/type-checkers';
import { DomainRequestName } from '../types';

const status = ['opened', 'closed', 'work in progress'] as const;
type Status = typeof status[number];
export function validateStatus(o: any): { valid: boolean; reason: string } {
   return { valid: isString(o) && status.includes(o as Status), reason: 'not a status' };
}
export interface Fields {
   id: string;
   name: string;
   status: Status;
}

export interface ExtendedFields {
   openingHours: OpeningHours[];
}

export interface ExpandableFields {}
// TODO add sponsors as expandable

export const domainRequestName: DomainRequestName = 'building';
export const expandableNames: Array<ExpandableName<DomainRequestName, ExpandableFields>> = [];

export interface OpeningHours {
   day: number;
   slots: TimeSlot[];
}
export interface TimeSlot {
   start: string;
   end: string;
}
