import { DomainRequestHandler, Factory, SelectMethodResult } from '/deps/index.ts';
import { DomainRequestName, Role } from '/app/domains/types.ts';
import * as Country from '@controllers/country/dr/index.ts';
import * as CountryPersistence from '@controllers/country/dr/builder/persistence/database/index.ts';

export function init(select: (query: string) => Promise<SelectMethodResult>): void {
   createFactories(select);
}

export function getDomainRequestHandler<DF>(
   name: DomainRequestName,
): DomainRequestHandler<Role, DomainRequestName, DF> {
   return getFactories()[name] as DomainRequestHandler<Role, DomainRequestName, DF>;
}

type DefaultType = Factory<
   Role,
   DomainRequestName,
   unknown
>;
function createFactories(select: (query: string) => Promise<SelectMethodResult>): void {
   factories = {
      country: Country.buildFactory(CountryPersistence.buildTableConnector(select)) as DefaultType,
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
