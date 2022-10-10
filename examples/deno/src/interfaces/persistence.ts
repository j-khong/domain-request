import { Client as MySqlClient, configLogger, SelectMethodResult } from '/deps/index.ts';
import { DbConf } from '/app/domains/ConfigurationFile.ts';

await configLogger({ enable: false });

let client: DatabaseConnector | undefined;

export function getDatabaseConnector(): DatabaseConnector {
   if (client === undefined) {
      throw new ConfigurationError('missing MySqlClient');
   }
   return client;
}

class ConfigurationError extends Error {}

abstract class DatabaseConnector {
   abstract query(q: string, values?: unknown[]): Promise<SelectMethodResult>;
}

class MySqlDatabaseConnector extends DatabaseConnector {
   constructor(private readonly client: MySqlClient) {
      super();
   }

   query(q: string, values?: unknown[]): Promise<SelectMethodResult> {
      return this.client.query(q, values);
   }
}

export async function buildDatabaseConnector(
   config: DbConf,
): Promise<void> {
   const c = await new MySqlClient().connect({
      hostname: config.host,
      username: config.user,
      password: config.password,
      port: config.port,
      db: config.name,
      poolSize: 10,
   });

   client = new MySqlDatabaseConnector(c);
}
