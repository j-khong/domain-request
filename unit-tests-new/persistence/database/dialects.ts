import { assert, assertEquals } from 'https://deno.land/std@0.149.0/testing/asserts.ts';
import { describe, it } from '../../data-fetch/mod.ts';
import { DomainRequest } from '../../mod.ts';
import * as Db from '../../../src/persistence/database/index.ts';

// the sql generated for each dialect: these tests do not need a database

type Call = { sql: string; params: unknown[] };

function createSelect(): { calls: Call[]; select: Db.SelectMethod } {
   const calls: Call[] = [];
   return {
      calls,
      select: (sql: string, params: unknown[]) => {
         calls.push({ sql, params: params as unknown[] });
         return Promise.resolve([{ total: 0 }]);
      },
   };
}

function createRequest(and: any[]): DomainRequest<string, any> {
   return {
      name: 'test',
      naturalKey: ['id'],
      fields: { name: true },
      filters: { and, or: [] },
      options: { pagination: { offset: 0, limit: 10 } },
   };
}

const usersTable = { name: 'users', primaryKey: 'id' };
const usersMapping = {
   id: new Db.SameTableMapping(usersTable, 'id', new Db.ToDbSqlNumberConverter(), Db.unknownToNumber),
   name: new Db.SameTableMapping(usersTable, 'name', new Db.ToDbSqlStringConverter(), Db.unknownToString),
   age: new Db.SameTableMapping(usersTable, 'age', new Db.ToDbSqlNumberConverter(), Db.unknownToNumber),
   active: new Db.SameTableMapping(usersTable, 'active', new Db.ToDbSqlBooleanConverter(), Db.unknownToBoolean),
};

// the sql of the count request, which holds the filters
async function generateSql(
   filter: any,
   dialect?: Db.Dialect,
): Promise<{ sql: string; params: unknown[]; errors: string[] }> {
   const { calls, select } = createSelect();
   const table = new Db.Table(usersTable, usersMapping, select, dialect === undefined ? undefined : { dialect });
   const result = await table.fetch(createRequest([filter]));
   return { sql: calls[0].sql, params: calls[0].params, errors: result.errors };
}

describe('Database persistence: sql dialects', () => {
   const contains = { name: { operator: 'contains', value: 'Ab' } };
   const icontains = { name: { operator: 'icontains', value: 'Ab' } };

   it('uses mysql by default', async () => {
      const { sql } = await generateSql(contains);
      assert(sql.includes("users.name LIKE BINARY ? ESCAPE '!'"), sql);
   });

   it('generates a case sensitive contains for each dialect', async () => {
      const mysql = await generateSql(contains, 'mysql');
      assert(mysql.sql.includes("WHERE (users.name LIKE BINARY ? ESCAPE '!')"), mysql.sql);
      assertEquals(mysql.params, ['%Ab%']);

      const postgres = await generateSql(contains, 'postgres');
      assert(postgres.sql.includes("WHERE (users.name LIKE $1 ESCAPE '!')"), postgres.sql);
      assertEquals(postgres.params, ['%Ab%']);

      const sqlite = await generateSql(contains, 'sqlite');
      assert(sqlite.sql.includes('WHERE (instr(users.name, ?) > 0)'), sqlite.sql);
      assertEquals(sqlite.params, ['Ab']);
   });

   it('generates a case insensitive icontains for each dialect', async () => {
      const mysql = await generateSql(icontains, 'mysql');
      assert(mysql.sql.includes("WHERE (LOWER(users.name) LIKE LOWER(?) ESCAPE '!')"), mysql.sql);
      assertEquals(mysql.params, ['%Ab%']);

      const postgres = await generateSql(icontains, 'postgres');
      assert(postgres.sql.includes("WHERE (LOWER(users.name) LIKE LOWER($1) ESCAPE '!')"), postgres.sql);
      assertEquals(postgres.params, ['%Ab%']);

      const sqlite = await generateSql(icontains, 'sqlite');
      assert(sqlite.sql.includes("WHERE (LOWER(users.name) LIKE LOWER(?) ESCAPE '!')"), sqlite.sql);
      assertEquals(sqlite.params, ['%Ab%']);
   });

   it('combines the values of a list with OR', async () => {
      const filter = { name: { operator: 'icontains', value: ['a', 'b'] } };
      const { sql, params } = await generateSql(filter, 'postgres');
      assert(
         sql.includes("(LOWER(users.name) LIKE LOWER($1) ESCAPE '!' OR LOWER(users.name) LIKE LOWER($2) ESCAPE '!')"),
         sql,
      );
      assertEquals(params, ['%a%', '%b%']);

      const sqlite = await generateSql({ name: { operator: 'contains', value: ['a', 'b'] } }, 'sqlite');
      assert(sqlite.sql.includes('(instr(users.name, ?) > 0 OR instr(users.name, ?) > 0)'), sqlite.sql);
      assertEquals(sqlite.params, ['a', 'b']);
   });

   it('escapes the wildcards of contains and icontains, but not for instr', async () => {
      for (const operator of ['contains', 'icontains']) {
         for (const dialect of ['mysql', 'postgres'] as const) {
            const { params, errors } = await generateSql({ name: { operator, value: '50%_!' } }, dialect);
            assertEquals(errors, []);
            assertEquals(params, ['%50!%!_!!%']);
         }
      }
      assertEquals((await generateSql({ name: { operator: 'icontains', value: '50%_!' } }, 'sqlite')).params, [
         '%50!%!_!!%',
      ]);
      assertEquals((await generateSql({ name: { operator: 'contains', value: '50%_!' } }, 'sqlite')).params, [
         '50%_!',
      ]);
   });

   it('keeps the other operators the same for each dialect', async () => {
      for (const dialect of ['mysql', 'postgres', 'sqlite'] as const) {
         const { sql } = await generateSql({ age: { operator: 'greaterThan', value: 18 } }, dialect);
         assert(sql.includes('WHERE (users.age > 18)'), sql);
      }
   });

   it('filters a boolean with TRUE and FALSE, which postgres needs', async () => {
      for (const dialect of ['mysql', 'postgres', 'sqlite'] as const) {
         const t = await generateSql({ active: { operator: 'equals', value: true } }, dialect);
         assert(t.sql.includes('WHERE (users.active = TRUE)'), t.sql);
         const f = await generateSql({ active: { operator: 'equals', value: 0 } }, dialect);
         assert(f.sql.includes('WHERE (users.active = FALSE)'), f.sql);
      }
   });

   it('numbers the placeholders of postgres in the order of the params, in every request', async () => {
      const { calls, select } = createSelect();
      const table = new Db.Table(usersTable, usersMapping, select, { dialect: 'postgres' });
      await table.fetch(
         createRequest([
            { name: { operator: 'equals', value: 'a' } },
            { name: { operator: 'contains', value: 'b' } },
            { name: { operator: 'equals', value: 'c' } },
         ]),
      );
      for (const call of calls) {
         assert(call.sql.includes('users.name = $1'), call.sql);
         assert(call.sql.includes("users.name LIKE $2 ESCAPE '!'"), call.sql);
         assert(call.sql.includes('users.name = $3'), call.sql);
         assert(!call.sql.includes('?'), call.sql);
         assertEquals(call.params, ['a', '%b%', 'c']);
      }
   });

   it('keeps "?" placeholders for mysql and sqlite', () => {
      const sql = `SELECT 1 WHERE a = ${Db.createSqlParam('x')} AND b = ${Db.createSqlParam(2)}`;
      for (const dialect of [undefined, 'mysql', 'sqlite'] as const) {
         assertEquals(Db.extractSqlParams(sql, dialect), { sql: 'SELECT 1 WHERE a = ? AND b = ?', params: ['x', 2] });
      }
      assertEquals(Db.extractSqlParams(sql, 'postgres'), { sql: 'SELECT 1 WHERE a = $1 AND b = $2', params: ['x', 2] });
   });

   it('takes the dialect from init()', async () => {
      const { calls, select } = createSelect();
      const table = new Db.Table(usersTable, usersMapping);
      table.init({ select, dialect: 'postgres' });
      await table.fetch(createRequest([contains]));
      assert(calls[0].sql.includes("users.name LIKE $1 ESCAPE '!'"), calls[0].sql);

      const defaultTable = new Db.Table(usersTable, usersMapping);
      const other = createSelect();
      defaultTable.init({ select: other.select });
      await defaultTable.fetch(createRequest([contains]));
      assert(other.calls[0].sql.includes("users.name LIKE BINARY ? ESCAPE '!'"), other.calls[0].sql);
   });
});
