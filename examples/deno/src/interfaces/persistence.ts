import { configLogger, MySqlClient, SelectMethodResult, SqlParam, SqliteClient } from '/deps/index.ts';
import { DbConf, MysqlDbConf, SqliteDbConf } from '@domains/ConfigurationFile.ts';

await configLogger({ enable: false });

let client: DatabaseConnector | undefined;

export function getDatabaseConnector(): DatabaseConnector {
   if (client === undefined) {
      throw new ConfigurationError('missing MySqlClient');
   }
   return client;
}

class ConfigurationError extends Error {}

export async function buildDatabaseConnector(config: DbConf): Promise<void> {
   switch (config.type) {
      case 'mysql': {
         client = await MySqlDatabaseConnector.build(config);
         break;
      }
      case 'sqlite': {
         client = await SqliteDatabaseConnector.build(config);
         break;
      }
   }
}

abstract class DatabaseConnector {
   abstract query(q: string, values?: SqlParam[]): Promise<SelectMethodResult>;
   abstract close(): Promise<void>;
}

class MySqlDatabaseConnector extends DatabaseConnector {
   private constructor(private readonly client: MySqlClient) {
      super();
   }

   static async build(config: MysqlDbConf): Promise<MySqlDatabaseConnector> {
      const c = await new MySqlClient().connect({
         hostname: config.host,
         username: config.user,
         password: config.password,
         port: config.port,
         db: config.name,
         poolSize: 10,
      });
      return new MySqlDatabaseConnector(c);
   }

   query(q: string, values?: SqlParam[]): Promise<SelectMethodResult> {
      return this.client.query(q, values);
   }

   async close(): Promise<void> {
      await this.client.close();
   }
}

class SqliteDatabaseConnector extends DatabaseConnector {
   constructor(private readonly client: SqliteClient) {
      super();
   }

   static async build(config: SqliteDbConf): Promise<SqliteDatabaseConnector> {
      const c = new SqliteClient();
      const tablesToCreate = await Deno.readTextFile(config.filepath);
      try {
         c.execute(tablesToCreate);
      } catch (e) {
         console.log('e:', e);
      }
      return new SqliteDatabaseConnector(c);
   }

   query(q: string, values?: SqlParam[]): Promise<SelectMethodResult> {
      return Promise.resolve(this.client.queryEntries(q, values) as SelectMethodResult);
   }

   async close(): Promise<void> {
      await this.client.close();
   }
}
