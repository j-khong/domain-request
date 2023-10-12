import * as CLI from '@jkhong/cli-js';
import { generateApiClient } from '@jkhong/domain-request';
import { getDomainRequestName, getRoles,type Role } from '../src/app/domains/types.ts';
import { getDomainRequestHandler, init } from '../src/app/index.ts';
import { getResourceDomainMapping } from '../src/interfaces/api/index.ts';
import { loadConfig } from '../src/interfaces/index.ts';
import { start } from '../src/start/index.ts';
import { readFile } from '../src/interfaces/filesystem.ts';

async function launchServer(cliOptions: CLI.Options) {
   const config = await loadConfig(cliOptions.getSwitchValue('settings'));
   if (config === undefined) {
      throw new Error(`cannot load seettings file ${cliOptions.getSwitchValue('settings')}`);
   }

   await start(config);
}
function generateDenoClient(cliOptions: CLI.Options) {
   generateClient(cliOptions, 'deno').catch((e) => console.log(e));
}
function generateNodeClient(cliOptions: CLI.Options) {
   generateClient(cliOptions, 'node').catch((e) => console.log(e));
}

async function generateClient(cliOptions: CLI.Options, target: 'deno' | 'node') {
   const roles = getRolesList(cliOptions.getSwitchValue('roles'));
   const destFolder = cliOptions.getSwitchValue('dest-folder');

   await generateApiClient(
      {
         destFolder,
         target,
         fetch: (url: string) => {
            const oUrl = new URL(url);
            return readFile(oUrl.pathname);
         },
      },
      { getDomainRequestHandler, init },
      {
         drn: getDomainRequestName(),
         roles,
         resourceDomainMapping: getResourceDomainMapping(),
      },
   );
}

const manualContent = {
   appName: 'Domain request API Server',
   binName: 'npx ts-node-dev -r tsconfig-paths/register tools/cli.ts',
   appSubTitle: '',
   appVersion: '0.0.1',
   about: '',
   actionsGroups: [
      {
         name: 'launch the server',
         desc: '',
         actions: [
            {
               name: 'launch-server',
               desc: '',
               switches: [
                  {
                     name: 'settings',
                     desc: 'path to the settings file',
                  },
               ],
               action: launchServer,
            },
         ],
      },
      {
         name: 'generation of api clients',
         desc: 'will generate a deno or node client',
         actions: [
            {
               name: 'gen-deno-client',
               desc: '',
               switches: [
                  {
                     name: 'dest-folder',
                     desc: 'path to the generated files folder',
                  },
                  {
                     name: 'roles',
                     desc: 'roles to manage in the api client',
                     validate: validateRoles,
                  },
               ],
               action: generateDenoClient,
            },
            {
               name: 'gen-node-client',
               desc: '',
               switches: [
                  {
                     name: 'dest-folder',
                     desc: 'path to the generated files folder',
                  },
                  {
                     name: 'roles',
                     desc: 'roles to manage in the api client',
                     validate: validateRoles,
                  },
               ],
               action: generateNodeClient,
            },
         ],
      },
   ],
};

class CustomCLI extends CLI.Interface {
   displayHeader(): void {}
}

try {
   const cli = new CustomCLI();
   cli.setManualContent(manualContent);
   cli.launch();
} catch (e) {
   console.log(e);
}

function validateRoles(str: string) {
   const roles = getRoles();
   const split = getRolesList(str);
   for (const r of split) {
      if (!roles.includes(r)) {
         throw new Error(`[${r}] is not a valid role`);
      }
   }
   return split;
}

function getRolesList(str: string) {
   return str.split(',') as Role[];
}
