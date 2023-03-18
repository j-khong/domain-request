import { z } from "zod";

const dbConf = z.discriminatedUnion('type', [
   z.object({
      type: z.literal('mysql'),
      name: z.string(),
      host: z.string(),
      user: z.string(),
      password: z.string(),
      port: z.number(),
   }),
   z.object({ type: z.literal('sqlite'), filepath: z.string() }),
]);

const serverConf = z.object({
   version: z.string().min(3),
   host: z.string(),
   port: z.number(),
});

const configFile = z.object({
   env: z.string().min(3),
   server: serverConf,
   database: dbConf,
});

export type ConfigFile = z.infer<typeof configFile>;
export type ServerConf = z.infer<typeof serverConf>;
export type DbConf = z.infer<typeof dbConf>;

export type MysqlDbConf = Extract<DbConf, { type: 'mysql' }>;
export type SqliteDbConf = Extract<DbConf, { type: 'sqlite' }>;

export function parse(data: unknown): ConfigFile {
   return configFile.parse(data);
}
