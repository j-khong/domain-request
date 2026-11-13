// https://github.com/denoland/dnt/
import { build, emptyDir } from 'https://deno.land/x/dnt@0.37.0/mod.ts';
import { copy } from 'https://deno.land/std@0.177.0/fs/mod.ts';

await emptyDir('./npm');

await build({
   entryPoints: ['./src/index.ts', { name: './tools', path: './src/tools.ts' }],
   outDir: './npm',
   // the unit tests need a database: they are run with deno (make unit-tests), not in the npm package
   test: false,
   // no shim: the sources only use node apis, so the package has no Deno dependency
   shims: {},
   package: {
      // package.json properties
      name: '@jkhong/domain-request',
      version: Deno.args[0],
      description: 'Domain request.',
      license: 'MIT',
      homepage: 'https://github.com/j-khong/domain-request#readme',
      repository: {
         type: 'git',
         url: 'https://github.com/j-khong/domain-request.git',
      },
      bugs: {
         url: 'https://github.com/j-khong/domain-request/issues',
      },
   },
});

// post build steps
Deno.copyFileSync('LICENSE', 'npm/LICENSE');
Deno.copyFileSync('readme.md', 'npm/README.md');

// templates read at runtime by generateApiClient, next to its module
await copy('src/tools/resources', 'npm/script/tools/resources', { overwrite: true });
await copy('src/tools/resources', 'npm/esm/tools/resources', { overwrite: true });
