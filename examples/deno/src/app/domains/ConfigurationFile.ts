export interface ConfigFile {
   env: string;
   server: ServerConf;
   database: DbConf;
}

export interface ServerConf {
   version: string;
   host: string;
   port: number;
}

export interface DbConf {
   host: string;
   user: string;
   password: string;
   name: string;
   port: number;
}
