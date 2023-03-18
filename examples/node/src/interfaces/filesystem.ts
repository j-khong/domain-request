import * as fs from 'fs';
import { ConfigFile,parse } from '@domains/ConfigurationFile';

export async function loadConfig(filename: string): Promise<ConfigFile | undefined> {
   try {
      const json = await readConfig(filename);
      if (json === null || json === undefined) {
         console.error(
            `error while parsing to json file content of ${filename}`,
         );
         return undefined;
      }

      // TODO validate with zod
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
   if (!fs.existsSync(filename)) {
      throw new Error(`missing settings file [${filename}]`);
   }
   return JSON.parse(await readFile(filename));
}

export async function readFile(filename: string): Promise<string> {
   return new Promise((resolve, reject) => {
      fs.readFile(filename, 'utf-8', (err, content) => {
         if (null !== err) {
            return reject(new Error(`Error loading file ${filename} : ${err.message}`));
         }

         resolve(content);
      });
   });
}
