import { ExpandableName } from '../../../src';
import * as Building from '../Building';
import * as Sponsor from '../Sponsor';
import { DomainRequestName } from '../types';

export const domainRequestName: DomainRequestName = 'buildingSponsor';

export interface Fields {
   id: string;
   buildingId: string;
   sponsorId: string;
}

export interface ExpandableFields {
   building: Building.Fields;
   sponsor: Sponsor.Fields;
}

export const expandableNames: Array<ExpandableName<DomainRequestName, ExpandableFields>> = ['sponsor', 'building'];
