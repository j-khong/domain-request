import { StringFieldConfiguration, FieldsSetup, LinkedDomainConfiguration, DomainConfig } from '../../mod.ts';
import { DomainRequestName, Role } from '../types.ts';
import * as Building from '../Building/index.ts';
import * as Sponsor from '../Sponsor/index.ts';

export const domainRequestName: DomainRequestName = 'buildingSponsor';

export interface Fields {
   id: string;
   building: Building.Fields;
   sponsor: Sponsor.Fields;
}

export function generateFieldsSetup(): FieldsSetup<Fields> {
   return {
      id: new StringFieldConfiguration({
         filtering: {
            byListOfValue: true,
         },
      }),
      building: new LinkedDomainConfiguration<DomainRequestName, Building.Fields>(
         domainRequestName,
         Building.domainRequestName,
      ),
      sponsor: new LinkedDomainConfiguration<DomainRequestName, Sponsor.Fields>(
         domainRequestName,
         Sponsor.domainRequestName,
      ),
   };
}

export function initDomainConfigWithDeps(dc: DomainConfig<DomainRequestName, Fields>, role: Role): void {
   const c = dc.fields.getConf();
   if (c.building !== undefined) {
      c.building.init(Building.createDomainConfig(role));
   }
   if (c.sponsor !== undefined) {
      c.sponsor.init(Sponsor.createDomainConfig(role));
   }
}
