import { assert, assertEquals } from 'https://deno.land/std@0.149.0/testing/asserts.ts';
import { afterEach, describe, it } from '../../data-fetch/mod.ts';
import { DomainRequest } from '../../mod.ts';
import * as Db from '../../../src/persistence/database/index.ts';
import { resetClient, select } from './dbUtils.ts';

type Call = { sql: string; params: unknown[] };

function createSelect(responses: Db.SelectMethodResult[]): { calls: Call[]; select: Db.SelectMethod } {
   const calls: Call[] = [];
   return {
      calls,
      select: (sql: string, params: unknown[]) => {
         calls.push({ sql, params });
         return Promise.resolve(responses[calls.length - 1] ?? []);
      },
   };
}

function createRequest(values: {
   fields: any;
   and?: any[];
   naturalKey?: string[];
   options?: any;
}): DomainRequest<string, any> {
   return {
      name: 'test',
      naturalKey: values.naturalKey ?? ['id'],
      fields: values.fields,
      filters: { and: values.and ?? [], or: [] },
      options: values.options ?? { pagination: { offset: 0, limit: 10 } },
   };
}

function createUsersTable(select: Db.SelectMethod) {
   const usersTable = { name: 'users', primaryKey: 'id' };
   return new Db.Table(
      usersTable,
      {
         id: new Db.SameTableMapping(usersTable, 'id', new Db.ToDbSqlNumberConverter(), Db.unknownToNumber),
         name: new Db.SameTableMapping(usersTable, 'name', new Db.ToDbSqlStringConverter(), Db.unknownToString),
         birthday: new Db.SameTableMapping(usersTable, 'birthday', new Db.ToDbSqlDateConverter(), Db.unknownToIsoDate),
      },
      select,
   );
}

function createCountriesTable(select: Db.SelectMethod) {
   const countriesTable = { name: 'countries', primaryKey: 'id' };
   const studentsTable = {
      name: 'students',
      primaryKey: 'id',
      foreign: { keyName: 'id_country', otherTable: countriesTable },
   };
   const applicationsTable = {
      name: 'course_applications',
      primaryKey: 'id',
      foreign: { keyName: 'id_student', otherTable: studentsTable },
   };
   const coursesTable = { name: 'courses', primaryKey: 'id' };

   const applicationsMapping = {
      course: new Db.OneToOneFieldMapping(
         coursesTable,
         'name',
         new Db.ToDbSqlStringConverter(),
         Db.unknownToString,
         applicationsTable.name,
         'id_course',
         false,
      ),
   };
   const studentsMapping = {
      firstname: new Db.SameTableMapping(
         studentsTable,
         'firstname',
         new Db.ToDbSqlStringConverter(),
         Db.unknownToString,
      ),
      applications: new Db.OneToManyTableMapping(applicationsTable, applicationsMapping),
   };
   return new Db.Table(
      countriesTable,
      {
         // the natural key is not the primary key of the table
         name: new Db.SameTableMapping(countriesTable, 'name', new Db.ToDbSqlStringConverter(), Db.unknownToString),
         students: new Db.OneToManyTableMapping(studentsTable, studentsMapping),
      },
      select,
   );
}

describe('Database persistence without database', () => {
   it('binds the filter values instead of writing them in the sql', async () => {
      const { calls, select } = createSelect([[{ total: 0 }]]);
      const value = "x' OR '1'='1";

      const result = await createUsersTable(select).fetch(
         createRequest({ fields: { name: true }, and: [{ name: { operator: 'equals', value } }] }),
      );

      assertEquals(result.errors, []);
      assertEquals(calls.length, 2);
      for (const call of calls) {
         assert(call.sql.includes('users.name = ?'), call.sql);
         assert(!call.sql.includes("'"), call.sql);
         assertEquals(call.params, [value]);
      }
      assertEquals(result.report.requests[0].params, [value]);
   });

   it('escapes the wildcards of a contains filter', async () => {
      const { calls, select } = createSelect([[{ total: 0 }]]);

      await createUsersTable(select).fetch(
         createRequest({ fields: { name: true }, and: [{ name: { operator: 'contains', value: '50%_!' } }] }),
      );

      assert(calls[0].sql.includes("users.name LIKE ? ESCAPE '!'"), calls[0].sql);
      assertEquals(calls[0].params, ['%50!%!_!!%']);
   });

   it('rejects a filter value which cannot be converted', async () => {
      const { calls, select } = createSelect([[{ total: 0 }]]);

      const result = await createUsersTable(select).fetch(
         createRequest({
            fields: { name: true },
            and: [
               { id: { operator: 'equals', value: '1 OR 1=1' } },
               { birthday: { operator: 'equals', value: 'not a date' } },
            ],
         }),
      );

      assertEquals(result.errors.length, 2);
      assert(result.errors[0].startsWith('invalid filter value for domain field name [id]'), result.errors[0]);
      assert(result.errors[1].startsWith('invalid filter value for domain field name [birthday]'), result.errors[1]);
      assert(calls[0].sql.includes('WHERE (1 = 0) AND (1 = 0)'), calls[0].sql);
      assertEquals(calls[0].params, []);
   });

   it('reports the failure of a database request', async () => {
      const result = await createUsersTable(() => Promise.reject(new Error('table users does not exist'))).fetch(
         createRequest({ fields: { name: true } }),
      );

      assertEquals(result.results, []);
      assertEquals(result.errors, [
         'database request failed: table users does not exist',
         'database request failed: table users does not exist',
      ]);
   });

   it('generates sql which is not specific to one database', async () => {
      const { calls, select } = createSelect([[{ total: 0 }]]);

      await createCountriesTable(select).fetch(
         createRequest({
            fields: { name: true },
            naturalKey: ['name'],
            and: [{ students: { and: [{ firstname: { operator: 'equals', value: 'pierre' } }], or: [] } }],
            options: { pagination: { offset: 20, limit: 10 } },
         }),
      );

      const sql = calls[1].sql.replaceAll(/\s+/g, ' ');
      assert(!sql.includes('GROUP BY'), sql);
      assert(sql.endsWith('ORDER BY countries.id ASC LIMIT 10 OFFSET 20'), sql);
      assert(
         sql.includes(
            'WHERE countries.id IN (SELECT countries.id FROM countries LEFT JOIN students ON students.id_country = countries.id WHERE ((students.firstname = ?)))',
         ),
         sql,
      );
      assertEquals(calls[1].params, ['pierre']);
   });

   it('attaches the one to many results with the primary key, whatever the natural key', async () => {
      const { calls, select } = createSelect([
         [{ total: 2 }],
         [
            { countries$name: 'france', countries$id: 'FR' },
            { countries$name: 'espagne', countries$id: 'ES' },
         ],
         [
            { countries$id: 'FR', students$id: 1, students$firstname: 'pierre' },
            { countries$id: 'FR', students$id: 2, students$firstname: 'jeanne' },
            { countries$id: 'ES', students$id: null, students$firstname: null },
         ],
      ]);

      const result = await createCountriesTable(select).fetch(
         createRequest({ fields: { name: true, students: { firstname: true } }, naturalKey: ['name'] }),
      );

      assertEquals(result.errors, []);
      assertEquals(result.results, [
         { name: 'france', students: [{ firstname: 'pierre' }, { firstname: 'jeanne' }] },
         { name: 'espagne', students: [] },
      ]);
      assert(calls[2].sql.includes('WHERE countries.id IN (?, ?)'), calls[2].sql);
      assertEquals(calls[2].params, ['FR', 'ES']);
   });

   it('fetches a one to many nested in a one to many', async () => {
      const { calls, select } = createSelect([
         [{ total: 1 }],
         [{ countries$name: 'france', countries$id: 1 }],
         [
            {
               countries$id: 1,
               students$id: 1,
               students$firstname: 'pierre',
               course_applications$id: 1,
               courses$name: 'Math',
            },
            {
               countries$id: 1,
               students$id: 1,
               students$firstname: 'pierre',
               course_applications$id: 3,
               courses$name: 'Arts',
            },
            {
               countries$id: 1,
               students$id: 2,
               students$firstname: 'jeanne',
               course_applications$id: 2,
               courses$name: 'Math',
            },
            {
               countries$id: 1,
               students$id: 3,
               students$firstname: 'paul',
               course_applications$id: null,
               courses$name: null,
            },
         ],
      ]);

      const result = await createCountriesTable(select).fetch(
         createRequest({
            fields: { name: true, students: { firstname: true, applications: { course: true } } },
            naturalKey: ['name'],
         }),
      );

      assertEquals(result.errors, []);
      assertEquals(result.results, [
         {
            name: 'france',
            students: [
               { firstname: 'pierre', applications: [{ course: 'Math' }, { course: 'Arts' }] },
               { firstname: 'jeanne', applications: [{ course: 'Math' }] },
               { firstname: 'paul', applications: [] },
            ],
         },
      ]);
      const sql = calls[2].sql.replaceAll(/\s+/g, ' ');
      assert(
         sql.includes(
            'LEFT JOIN students ON students.id_country = countries.id LEFT JOIN course_applications ON course_applications.id_student = students.id LEFT JOIN courses',
         ),
         sql,
      );
      assert(sql.includes('ORDER BY countries.id ASC, students.id ASC, course_applications.id ASC'), sql);
   });
});

describe('Database persistence with database', () => {
   afterEach(async () => {
      await resetClient();
   });

   it('does not let a filter value change the request', async () => {
      const table = createCountriesTable(select);

      const injection = await table.fetch(
         createRequest({
            fields: { name: true },
            naturalKey: ['name'],
            and: [{ name: { operator: 'equals', value: "x' OR '1'='1" } }],
         }),
      );
      assertEquals(injection.errors, []);
      assertEquals(injection.total, 0);
      assertEquals(injection.results, []);

      const wildcard = await table.fetch(
         createRequest({
            fields: { name: true },
            naturalKey: ['name'],
            and: [{ name: { operator: 'contains', value: '%' } }],
         }),
      );
      assertEquals(wildcard.errors, []);
      assertEquals(wildcard.total, 0);
   });

   it('fetches a one to many nested in a one to many', async () => {
      const result = await createCountriesTable(select).fetch(
         createRequest({
            fields: { name: true, students: { firstname: true, applications: { course: true } } },
            naturalKey: ['name'],
         }),
      );

      assertEquals(result.errors, []);
      assertEquals(result.results, [
         {
            name: 'france',
            students: [
               {
                  firstname: 'pierre',
                  applications: [{ course: 'Math 101' }, { course: 'Arts' }, { course: 'History' }],
               },
               { firstname: 'jeanne', applications: [{ course: 'Math 101' }] },
            ],
         },
         { name: 'espagne', students: [] },
      ]);
   });

   it('reports a sql error', async () => {
      const unknownTable = { name: 'unknown_table', primaryKey: 'id' };
      const table = new Db.Table(
         unknownTable,
         { id: new Db.SameTableMapping(unknownTable, 'id', new Db.ToDbSqlNumberConverter(), Db.unknownToNumber) },
         select,
      );

      const result = await table.fetch(createRequest({ fields: { id: true } }));

      assertEquals(result.results, []);
      assertEquals(result.errors.length, 2);
      assert(result.errors[0].startsWith('database request failed: '), result.errors[0]);
   });
});
