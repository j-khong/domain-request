import { loadConfig } from './interfaces/index.ts';
import { start } from './start/index.ts';

if (Deno.args.length === 0 || Deno.args[0] !== '--settings') {
   console.error('please provide a --settings arg');
   Deno.exit(1);
}

const config = await loadConfig(Deno.args[1]);
if (config === undefined) {
   Deno.exit(2);
}

await start(config);
