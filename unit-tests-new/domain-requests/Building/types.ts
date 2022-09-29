import {
   isString,
   DomainConfig,
   ObjectFieldConfiguration,
   FieldConfiguration,
   StringFieldConfiguration,
   NumberFieldConfiguration,
   LinkedDomainConfiguration,
   FieldsSetup,
} from '../../mod.ts';
import { DomainRequestName, Role } from '../types.ts';
import * as SponsorO from '../Sponsor/index.ts';
import * as Category from '../BuildingCategory/index.ts';
import * as Architect from '../Architect/index.ts';
export const domainRequestName: DomainRequestName = 'building';

export type Sponsor = SponsorO.Fields & { contribution: number };
export interface Fields {
   id: string;
   name: string;
   type: Category.Fields;
   status: Status;
   privateField: string;
   openingHours: OpeningHours[];
   pictures: Picture[];
   sponsors: Sponsor[];
   architect: Architect.Fields;
}

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

const status = ['opened', 'closed', 'work in progress'] as const;
export type Status = typeof status[number];

export function generateFieldsSetup(): FieldsSetup<Fields> {
   return {
      id: new StringFieldConfiguration({
         filtering: {
            byListOfValue: true,
         },
      }),
      name: new StringFieldConfiguration({
         filtering: {
            byRangeOfValue: true,
            byListOfValue: true,
         },
      }),
      type: new LinkedDomainConfiguration<DomainRequestName, Category.Fields>('building', Category.domainRequestName),
      status: new FieldConfiguration<Status>({
         filtering: {
            byListOfValue: true,
         },
         values: {
            default: 'opened',
            typeValidator: isStatus,
            typeName: 'Status',
         },
      }),
      privateField: new StringFieldConfiguration({
         filtering: {
            byRangeOfValue: true,
            byListOfValue: true,
         },
      }),
      sponsors: new ObjectFieldConfiguration<Sponsor>({
         id: new StringFieldConfiguration({
            filtering: { byListOfValue: true },
         }),
         name: new StringFieldConfiguration({
            filtering: { byListOfValue: true },
         }),
         contribution: new NumberFieldConfiguration({
            filtering: { byListOfValue: true },
         }),
      }),
      architect: new LinkedDomainConfiguration<DomainRequestName, Architect.Fields>('building', 'architect'),
      openingHours: new ObjectFieldConfiguration<OpeningHours>({
         day: new NumberFieldConfiguration({
            filtering: {
               byRangeOfValue: true,
               byListOfValue: true,
            },
         }),
         slots: new ObjectFieldConfiguration<TimeSlot>({
            start: new StringFieldConfiguration({
               filtering: {
                  byRangeOfValue: true,
                  byListOfValue: true,
               },
            }),
            end: new StringFieldConfiguration({
               filtering: {
                  byRangeOfValue: true,
                  byListOfValue: true,
               },
            }),
         }),
      }),
      pictures: new ObjectFieldConfiguration<Picture>({
         url: new StringFieldConfiguration({
            filtering: { byListOfValue: true },
         }),
         name: new StringFieldConfiguration({
            filtering: { byListOfValue: true },
         }),
         description: new StringFieldConfiguration({
            filtering: { byListOfValue: true },
         }),
         status: new StringFieldConfiguration({
            filtering: { byListOfValue: true },
         }),
      }),
   };
}

function isStatus(o: any): o is Status {
   return isString(o) && status.includes(o as Status);
}

export function initDomainConfigWithDeps(dc: DomainConfig<DomainRequestName, Fields>, role: Role): void {
   const c = dc.fields.getConf();
   if (c.type !== undefined) {
      c.type.init(Category.createDomainConfig(role));
   }
   if (c.architect !== undefined) {
      c.architect.init(Architect.createDomainConfig(role));
   }
}
