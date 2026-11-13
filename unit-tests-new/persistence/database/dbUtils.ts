import { Client, configLogger } from 'https://deno.land/x/mysql@v2.10.2/mod.ts';
import { Pool } from 'https://deno.land/x/postgres@v0.17.0/mod.ts';
import { Dialect, SelectMethodResult } from '../../mod.ts';
configLogger({ enable: false });

// the database of the tests: the one started by the makefile (UNIT_TESTS_DB), mysql by default
export const dbKind: 'mysql' | 'postgres' = Deno.env.get('UNIT_TESTS_DB') === 'postgres' ? 'postgres' : 'mysql';
export const dialect: Dialect = dbKind;

// default values are the ones of the test container started by the makefile
const config = {
   name: Deno.env.get('DB_NAME') ?? (dbKind === 'postgres' ? 'domain_request' : 'domain-request'),
   host: Deno.env.get('DB_HOST') ?? '127.0.0.1',
   port: Number(Deno.env.get('DB_PORT') ?? (dbKind === 'postgres' ? 8107 : 8106)),
   user: Deno.env.get('DB_USER') ?? (dbKind === 'postgres' ? 'postgres' : 'root'),
   password: Deno.env.get('DB_PASSWORD') ?? 'gWpYF4dZfW',
};

type DbClient = {
   select: (query: string, params: unknown[]) => Promise<SelectMethodResult>;
   close: () => Promise<void>;
};

function createMysqlClient(): DbClient {
   let client: Client | undefined;
   const getClient = async (): Promise<Client> => {
      if (client === undefined) {
         client = await new Client().connect({
            hostname: config.host,
            username: config.user,
            password: config.password,
            port: config.port,
            db: config.name,
            poolSize: 10,
         });
      }
      return client;
   };
   return {
      select: async (query, params) => (await getClient()).query(query, params),
      close: async () => (await getClient()).close(),
   };
}

function createPostgresClient(): DbClient {
   // the pool connects lazily, and the session is in UTC like the tests process (TZ=UTC)
   const pool = new Pool(
      {
         hostname: config.host,
         port: config.port,
         user: config.user,
         password: config.password,
         database: config.name,
         options: { TimeZone: 'UTC' },
      },
      10,
      true,
   );
   return {
      select: async (query, params) => {
         const connection = await pool.connect();
         try {
            const { rows } = await connection.queryObject(query, params as any[]);
            return rows as SelectMethodResult;
         } finally {
            connection.release();
         }
      },
      close: () => pool.end(),
   };
}

let c: DbClient | undefined;

function getClient(): DbClient {
   if (c === undefined) {
      c = dbKind === 'postgres' ? createPostgresClient() : createMysqlClient();
   }
   return c;
}
export function select(query: string, params: unknown[] = []): Promise<SelectMethodResult> {
   return getClient().select(query, params);
}

export async function resetClient(): Promise<void> {
   await getClient().close();
   c = undefined;
}

///////////
///////////
///////////

// import { DB as Client } from 'https://deno.land/x/sqlite/mod.ts';
// import { Path } from '../../../src/deps/index.ts';

// let c: Client | undefined;

// async function getClient(): Promise<Client> {
//    if (c === undefined) {
//       c = new Client();
//       const currentFilePath = Path.dirname(Path.fromFileUrl(import.meta.url));
//       const tablesToCreate = await Deno.readTextFile(Path.join(currentFilePath, 'sqlite.tables.sql'));
//       try {
//          c.execute(tablesToCreate);
//       } catch (e) {
//          console.log('e:', e);
//       }
//    }
//    return c;
// }
// export async function select(query: string): Promise<Array<{ [key: string]: string | number | Date | boolean }>> {
//    const c = await getClient();
//    return c.queryEntries(query);
// }

// export async function resetClient(): Promise<void> {
//    await (await getClient()).close();
//    c = undefined;
// }
