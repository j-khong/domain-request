import { Client, configLogger } from 'https://deno.land/x/mysql@v2.10.2/mod.ts';
import { SelectMethodResult } from '../../mod.ts';
configLogger({ enable: false });
// default values are the ones of the test container started by the makefile
const config = {
   name: Deno.env.get('DB_NAME') ?? 'domain-request',
   host: Deno.env.get('DB_HOST') ?? '127.0.0.1',
   port: Number(Deno.env.get('DB_PORT') ?? 8106),
   user: Deno.env.get('DB_USER') ?? 'root',
   password: Deno.env.get('DB_PASSWORD') ?? 'gWpYF4dZfW',
};

let c: Client | undefined;

async function getClient(): Promise<Client> {
   if (c === undefined) {
      c = await new Client().connect({
         hostname: config.host,
         username: config.user,
         password: config.password,
         port: config.port,
         db: config.name,
         poolSize: 10,
      });
   }
   return c;
}
export async function select(query: string, params: unknown[] = []): Promise<SelectMethodResult> {
   const c = await getClient();
   return c.query(query, params);
}

export async function resetClient(): Promise<void> {
   await (await getClient()).close();
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
