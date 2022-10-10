import { ConfigFile } from '/app/domains/ConfigurationFile.ts';

export async function loadConfig(filename: string): Promise<ConfigFile | undefined> {
   try {
      const str = await Deno.readTextFile(filename);
      const json = JSON.parse(str);
      if (json === null || json === undefined) {
         console.error(
            `error while parsing to json file content of ${filename}`,
         );
         return undefined;
      }

      // TODO validate with joi

      config = json;
      return json;
   } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
         console.error('file does not exists', e);
      } else {
         console.error(e);
      }
   }
   return undefined;
}

let config: ConfigFile | undefined;
export function getConfigFile(): ConfigFile {
   if (config === undefined) throw new Error('config file not set');

   return config;
}
