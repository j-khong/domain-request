// import * as sqlite from 'bun:sqlite';
// import sqlite3 from 'bun:sqlite';
import * as sqlite from 'sqlite';
import sqlite3 from 'sqlite3';

import * as mysql from 'mysql';
import { SelectMethodResult } from '/deps/index.ts';
import { DbConf, MysqlDbConf, SqliteDbConf } from '@domains/ConfigurationFile.ts';
import { readFile } from './filesystem.ts';

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
   abstract query(q: string, values?: unknown[]): Promise<SelectMethodResult>;
   abstract close(): Promise<void>;
}

class MySqlDatabaseConnector extends DatabaseConnector {
   private constructor(private readonly client: mysql.Connection) {
      super();
   }

   static async build(config: MysqlDbConf): Promise<MySqlDatabaseConnector> {
      const c = mysql.createConnection({
         database: config.name,
         host: config.host,
         user: config.user,
         password: config.password,
         port: config.port,
      });
      c.connect();
      return new MySqlDatabaseConnector(c);
   }

   query(q: string, values?: unknown[]): Promise<SelectMethodResult> {
      return new Promise((resolve, reject) => {
         const cb = (error: mysql.MysqlError | null, results?: any, fields?: mysql.FieldInfo[]): void => {
            if (error !== null) return reject(error);
            resolve(results);
         };

         if (values !== undefined) {
            this.client.query(q, values, cb);
         } else {
            this.client.query(q, cb);
         }
      });
   }

   async close(): Promise<void> {
      await this.client.end();
   }
}
class SqliteDatabaseConnector extends DatabaseConnector {
   constructor(private readonly client: sqlite.Database) {
      super();
   }

   static async build(config: SqliteDbConf): Promise<SqliteDatabaseConnector> {
      const db = await sqlite.open({
         filename: ':memory:',
         driver: sqlite3.Database,
      });
      const tablesToCreate = await readFile(config.filepath);
      try {
         db.exec(tablesToCreate);
      } catch (e) {
         console.log('e:', e);
      }
      return new SqliteDatabaseConnector(db);
   }

   async query(q: string, values?: unknown[]): Promise<SelectMethodResult> {
      const res = await this.client.all(q);
      return res as SelectMethodResult;
   }

   async close(): Promise<void> {
      await this.client.close();
   }
}
