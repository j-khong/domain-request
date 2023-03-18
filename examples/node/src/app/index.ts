import { DomainRequestHandler, Factory, SelectMethodResult } from '@jkhong/domain-request';
import { DomainRequestName, Role } from '@domains/types';
import * as Country from '@services/country/dr';
import * as CountryPersistence from '@services/country/dr/builder/persistence';
import * as Architect from '@services/architect/dr';
import * as ArchitectPersistence from '@services/architect/dr/builder/persistence';

export function init(select: (query: string) => Promise<SelectMethodResult>): void {
   createFactories(select);
}

export function getDomainRequestHandler<DF>(
   name: DomainRequestName,
): DomainRequestHandler<Role, DomainRequestName, DF> {
   return getFactories()[name] as DomainRequestHandler<Role, DomainRequestName, DF>;
}

type DefaultType = Factory<Role, DomainRequestName, unknown>;
function createFactories(select: (query: string) => Promise<SelectMethodResult>): void {
   factories = {
      country: Country.buildFactory(CountryPersistence.buildConnector(select)) as DefaultType,
      architect: Architect.buildFactory(ArchitectPersistence.buildConnector(select)) as DefaultType,
   };
}

type Factories = {
   [Property in DomainRequestName]: Factory<Role, DomainRequestName, unknown>;
};
function getFactories(): Factories {
   if (factories === undefined) throw new Error('please init domains requests ');
   return factories;
}

let factories: Factories | undefined;
