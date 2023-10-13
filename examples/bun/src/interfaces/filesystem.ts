import { ConfigFile, parse } from '@domains/ConfigurationFile.ts';

export async function loadConfig(filename: string): Promise<ConfigFile | undefined> {
   try {
      const json = await readConfig(filename);
      if (json === null || json === undefined) {
         console.error(`error while parsing to json file content of ${filename}`);
         return undefined;
      }

      config = parse(json);
      return config;
   } catch (e) {
      console.error(e);
   }
   return undefined;
}

let config: ConfigFile | undefined;
export function getConfigFile(): ConfigFile {
   if (config === undefined) throw new Error('config file not set');

   return config;
}

async function readConfig(filename: string): Promise<unknown> {
   const file = Bun.file(filename);
   if (!(await file.exists())) {
      throw new Error(`missing settings file [${filename}]`);
   }
   return JSON.parse(await readFile(filename));
}

export async function readFile(filename: string): Promise<string> {
   try {
      const file = Bun.file(filename);
      return file.text();
   } catch (e) {
      throw new Error(`Error loading file ${filename} : ${e.message}`);
   }
}
