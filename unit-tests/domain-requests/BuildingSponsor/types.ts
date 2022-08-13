import { ExpandableName, FilteringConfig } from '../../mod.ts';
import { DomainRequestName } from '../types.ts';
import * as Building from '../Building/index.ts';
import * as Sponsor from '../Sponsor/index.ts';

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

export function generateFilteringConfig(): FilteringConfig<Fields> {
   return {
      id: {
         filtering: {
            byListOfValue: true,
         },
         values: {
            default: '',
         },
      },
      buildingId: {
         filtering: {
            byListOfValue: true,
         },
         values: {
            default: '',
         },
      },
      sponsorId: {
         filtering: {
            byListOfValue: true,
         },
         values: {
            default: '',
         },
      },
   };
}
