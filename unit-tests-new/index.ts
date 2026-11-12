import { init } from './domain-requests/init.ts';
import { select } from './persistence/database/dbUtils.ts';

console.log = () => {};
init(select);
export * from './data-fetch/index.ts';
export * from './domain-request/options.ts';
export * from './persistence/database/table.ts';
export * from './readme.ts';
