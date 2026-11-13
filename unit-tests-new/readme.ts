// the quick start of readme.md: keep both in sync
import { assertEquals } from 'https://deno.land/std@0.149.0/testing/asserts.ts';
import { afterEach, describe, it } from './data-fetch/mod.ts';
import { resetClient, select } from './persistence/database/dbUtils.ts';
import {
   buildDomainRequestFactory,
   createDomainRoleBuilder,
   FieldConfigFactory,
   FieldsSetup,
   MappingBuilder,
   SelectMethod,
   Table,
} from './mod.ts';

// 1. the business domain, and who can request it
interface Country {
   id: string;
   name: string;
   timezone: string;
}

type Role = 'admin' | 'visitor';
const roles: Role[] = ['admin', 'visitor'];

// 2. what can be selected and filtered
function generateFieldsSetup(): FieldsSetup<Country> {
   return {
      id: FieldConfigFactory.createString({ filtering: { byListOfValue: true } }),
      name: FieldConfigFactory.createString({ filtering: { byListOfValue: true } }),
      timezone: FieldConfigFactory.createString(),
   };
}

// 3. what each role can access
const countryByRole = createDomainRoleBuilder('country', generateFieldsSetup, roles)
   .role('admin')
   .withAllFields()
   .and()
   .role('visitor')
   .withFields('id', 'name')
   .and()
   .build();

// 4. where the data is stored
interface CountryRow {
   id: number;
   name: string;
   timezone: string;
}
const countriesTable = { name: 'countries', primaryKey: 'id' };
const countryMapping = new MappingBuilder<Country, CountryRow>(
   countriesTable,
   { id: '', name: '', timezone: '' },
   ['id', 'name', 'timezone'],
)
   .addAutoMapping('id', 'name', 'timezone')
   .build();

function createCountryFactory(select: SelectMethod) {
   return buildDomainRequestFactory(countryByRole, new Table(countriesTable, countryMapping, select));
}

describe('Readme quick start', () => {
   afterEach(async () => {
      await resetClient();
   });

   it('fetches the countries', async () => {
      const countries = createCountryFactory(select);

      const { request, errors } = countries.getRoleDomainRequestBuilder('visitor').build({
         fields: { name: true },
         filters: { name: { operator: 'contains', value: 'e' } },
         options: { orderby: 'name asc', limit: 10 },
      });
      const result = await countries.fetchDomain(request);

      assertEquals(errors, []);
      assertEquals(result.errors, []);
      assertEquals(result.total, 2);
      assertEquals(result.results, [
         { id: '2', name: 'espagne' },
         { id: '1', name: 'france' },
      ]);
      // the results are typed with the domain
      const name: string | undefined = result.results[0].name;
      assertEquals(name, 'espagne');
   });

   it('reports the fields a role cannot access', () => {
      const countries = createCountryFactory(select);

      const { errors } = countries.getRoleDomainRequestBuilder('visitor').build({ fields: { timezone: true } });

      assertEquals(errors, [{ context: 'selected field', fieldName: 'timezone', reason: 'unknown field [timezone]' }]);
   });
});
