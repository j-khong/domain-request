import { isString } from '../../../src/DomainRequest/type-checkers';
import { DomainRequestName } from '../types';
import * as BuildingSponsor from '../BuildingSponsor';
import { ExpandableName } from '../../../src';

const status = ['opened', 'closed', 'work in progress'] as const;
type Status = typeof status[number];
export function validateStatus(o: any): { valid: boolean; reason: string } {
   return { valid: isString(o) && status.includes(o as Status), reason: 'not a status' };
}

export const domainRequestName: DomainRequestName = 'building';

export interface Fields {
   id: string;
   name: string;
   status: Status;
   privateField: string;
}

export interface ExtendedFields {
   openingHours: OpeningHours[];
   pictures: Picture[];
}

export interface ExpandableFields {
   sponsors: BuildingSponsor.Fields;
}
export const expandableNames: Array<ExpandableName<DomainRequestName, ExpandableFields>> = [
   { globalContext: 'buildingSponsor', currentContext: 'sponsors' },
];

export interface Picture {
   url: string;
   name: string;
   description: string;
   status: string;
}
export interface OpeningHours {
   day: number;
   slots: TimeSlot[];
}
export interface TimeSlot {
   start: string;
   end: string;
}
