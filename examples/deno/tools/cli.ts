import CLI from 'npm:@jkhong/cli-js';
import Options from 'npm:@jkhong/cli-js/cli/domain/Options';
import { generateApiClient } from '../src/deps/index.ts';
import { getDomainRequestName, getRoles, Role } from '../src/app/domains/types.ts';
import { getDomainRequestHandler, init } from '../src/app/index.ts';
import { getResourceDomainMapping } from '../src/interfaces/api/index.ts';
import { loadConfig } from '../src/interfaces/index.ts';
import { start } from '../src/start/index.ts';

async function launchServer(cliOptions: Options) {
   const config = await loadConfig(cliOptions.getSwitchValue('settings'));
   if (config === undefined) {
      throw new Error(`cannot load settings file ${cliOptions.getSwitchValue('settings')}`);
   }

   await start(config);
}

function generateDenoClient(cliOptions: Options) {
   generateClient(cliOptions, 'deno').catch((e) => console.log(e));
}
function generateNodeClient(cliOptions: Options) {
   generateClient(cliOptions, 'node').catch((e) => console.log(e));
}

async function generateClient(cliOptions: Options, target: 'deno' | 'node') {
   const roles = validateRoles(cliOptions.getSwitchValue('roles'));
   const destFolder = cliOptions.getSwitchValue('dest-folder');

   await generateApiClient(
      {
         destFolder,
         target,
         fetch: async (url: string) => {
            const res = await fetch(url);
            return res.text();
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
   binName: '',
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
   const split = str.split(',') as Role[];
   for (const r of split) {
      if (!roles.includes(r)) {
         console.error(`[${r}] is not a valid role`);
         throw new Error(`[${r}] is not a valid role`);
      }
   }
   return split;
}
