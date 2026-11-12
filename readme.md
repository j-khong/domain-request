# Domain Request

Build the read side of an API (the Query of [CQRS](https://martinfowler.com/bliki/CQRS.html)) with little code:
clients request exactly the fields they need of a business domain, with filters and pagination,
and the library turns it into database requests.

- **Domain**, as in Domain Driven Design: clients query your business model, not your database model.
  The mapping between both is declared once.
- **Request**, as in data request: like GraphQL, a request is a plain object telling which fields to fetch,
  which values to filter on, and how to sort and paginate.
- **Roles**: each role sees its own subset of fields and of authorized values.

```ts
{
   fields: { name: true, architect: { name: true } },
   filters: { status: { operator: 'equals', value: 'opened' } },
   options: { orderby: 'name asc', limit: 10 },
}
```

## Table of content

- [Installation](#installation)
- [Quick start](#quick-start)
- [Connecting your database](#connecting-your-database)
- [Requests](#requests)
- [Results and errors](#results-and-errors)
- [Generating an API client](#generating-an-api-client)
- [Examples](#examples)
- [Deprecated API](#deprecated-api)
- [Development](#development)

## Installation

Deno:

```ts
import { createDomainRoleBuilder } from 'https://deno.land/x/domain_request@<version>/src/index.ts';
```

Node.js (and Bun):

```sh
npm install @jkhong/domain-request
```

```ts
import { createDomainRoleBuilder } from '@jkhong/domain-request';
```

## Quick start

A `country` domain, stored in a `countries` table, that an `admin` can fully read
and a `visitor` can only partially read.

```ts
import {
   buildDomainRequestFactory,
   createDomainRoleBuilder,
   FieldConfigFactory,
   FieldsSetup,
   MappingBuilder,
   SelectMethod,
   Table,
} from '@jkhong/domain-request';

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
```

Then, for each incoming request:

```ts
const countries = createCountryFactory(select); // once, see "Connecting your database"

const { request, errors } = countries.getRoleDomainRequestBuilder('visitor').build({
   fields: { name: true },
   filters: { name: { operator: 'contains', value: 'e' } },
   options: { orderby: 'name asc', limit: 10 },
});
const result = await countries.fetchDomain(request);

// errors: []
// result.total: 2
// result.results: [{ id: '2', name: 'espagne' }, { id: '1', name: 'france' }]
```

The results are typed with the domain (`result.results[0].name` is a `string | undefined`).
The natural key (`id` by default) is always returned.

A visitor requesting `{ fields: { timezone: true } }` gets
`[{ context: 'selected field', fieldName: 'timezone', reason: 'unknown field [timezone]' }]` in `errors`.

This quick start is run as a test (`unit-tests-new/readme.ts`).

### Going further

- **Field types**: `FieldConfigFactory.createString`, `createNumber`, `createBoolean`, `createDate`, `createIsoDate`.
  `filtering: { byListOfValue: true }` allows filtering on a list of values,
  `filtering: { byRangeOfValue: true }` allows the `between` operator,
  `values: { authorized: [...] }` restricts the values that can be requested.
- **Nested objects and relations**: `ObjectFieldConfiguration` for a sub object,
  `LinkedDomainConfiguration` / `ArrayOfLinkedDomainConfiguration` to embed another domain.
  On the persistence side, `SameTableObjectMapping`, `OneToOneTableMapping`, `OneToOneFieldMapping`
  and `OneToManyTableMapping` (which can be nested).
- **Per role values**: `.role('student').withFields(...).modifyFields((setup) => setup.status.addAuthorized(['opened']))`.
- **Custom conversions**: `MappingBuilder.addCustomMapping(domainField, tableField, toDbConverter, toDomain)`,
  with `ValueMapper` to translate enumerations (e.g. `'o'` in the database, `'opened'` in the domain).

The domains of `unit-tests-new/domain-requests-new` cover all these cases.

## Connecting your database

The library generates the SQL, you run it: a `SelectMethod` receives the request and the values to bind.
Filter values are never written in the SQL, they are passed as `params` for the `?` placeholders.

Deno, with [deno mysql](https://deno.land/x/mysql):

```ts
import { Client } from 'https://deno.land/x/mysql@v2.10.2/mod.ts';

const client = await new Client().connect({ hostname, username, password, db });
const select: SelectMethod = (query, params) => client.query(query, params);
```

Node.js, with [mysql2](https://www.npmjs.com/package/mysql2):

```ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({ host, user, password, database });
const select: SelectMethod = async (query, params) => {
   const [rows] = await pool.query(query, params);
   return rows as SelectMethodResult;
};
```

The generated SQL avoids database specific syntax (`LIMIT … OFFSET …`, no `GROUP BY`), but it is only tested with MySQL.
For a database using numbered placeholders (e.g. PostgreSQL), rewrite them: the generated SQL contains no other `?`.

```ts
const select: SelectMethod = async (query, params) => {
   let i = 0;
   const { rows } = await pool.query(query.replace(/\?/g, () => `$${++i}`), params);
   return rows;
};
```

## Requests

Field names are written in snake_case in requests (`max_seats`), and in camelCase in the results (`maxSeats`).

### Fields selection

```ts
{
   fields: {
      name: true,
      architect: { name: true }, // object or linked domain
      sponsors: { name: true }, // array
   },
}
```

### Value filtering

```ts
{
   filters: {
      name: { operator: 'equals', value: 'Arts' },
      max_seats: { operator: 'lesser_than', value: 400 },
      sponsors: { name: { operator: 'contains', value: 'e' } }, // filter on a sub field
   },
}
```

Operators: `equals`, `greater_than`, `greater_than_or_equals`, `lesser_than`, `lesser_than_or_equals`, `contains`,
and `between` with `value: [min, max]` when the field allows `byRangeOfValue`.
With `byListOfValue`, `value` can be a list: `{ operator: 'equals', value: ['Arts', 'History'] }`.

Filters are combined with AND. To combine them differently, use `and` and `or` arrays:

```ts
{
   filters: {
      or: [
         { name: { operator: 'equals', value: 'Arts' } },
         { name: { operator: 'equals', value: 'History' } },
      ],
   },
}
```

### Options

```ts
{
   options: {
      offset: 0, // default 0
      limit: 10, // default 100, max 5000
      orderby: 'name desc', // "field_name asc|desc"
      sponsors: { orderby: 'name asc', limit: 2, use_filter: true }, // options of an array field
   },
}
```

By default, the filters on an array field select the main results having a matching element, but all the elements are returned.
With `use_filter: true`, only the matching elements are returned, and the `orderby`, `offset` and `limit` of the array field apply
(they are ignored without it).

## Results and errors

`build()` returns the sanitized `request` and the `errors` of the input (unknown fields, wrong operators,
unauthorized values…): they are meant for the API client. Invalid parts of the input are ignored, the rest is processed.

`fetchDomain()` returns:

- `results` and `total` (the number of results without pagination)
- `errors`: persistence problems, such as a failed database request or a domain field without persistence mapping
- `report`: each SQL request run, with its params and duration

`errors` and `report` describe your database: log them, do not send them to API clients.

## Generating an API client

`generateApiClient` generates typed TypeScript clients from your domains (one request type per role).
It uses the Deno APIs, so it has its own entry point:

```ts
import { generateApiClient } from 'https://deno.land/x/domain_request@<version>/src/tools.ts';
// or, with npm
import { generateApiClient } from '@jkhong/domain-request/tools';
```

## Examples

[examples](./examples) contains the same query server running on
[node](./examples/node) <img src="./images/nodejs.svg" width="50"/>,
[deno](./examples/deno) <img src="./images/deno.svg" width="20"/> and
[bun](./examples/bun) <img src="./images/bun.svg" width="20"/>.
They all use the same domains, so the differences between them are only due to the runtime.
For each server, you can generate a client to be run on deno, node or bun.

The examples use the published version 0.7.0 of the library.

## Deprecated API

`buildDomainRequestBuilderByRole` and the `StringFieldConfiguration`-like classes are still exported, but deprecated:
see [src/domain-request/old](./src/domain-request/old/README.md) to migrate.

## Development

Requires Deno 1.31 and Docker (the unit tests run against a MySQL container).

```sh
make unit-tests UNIT_TESTS_API=new   # or old, for the deprecated API
make lint
make check
make tests-coverage                  # requires lcov
make help                            # all the targets
```
