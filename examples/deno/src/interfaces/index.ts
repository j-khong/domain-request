import { ConfigFile } from '@domains/ConfigurationFile.ts';
import { buildDatabaseConnector } from './persistence.ts';
export { getConfigFile, loadConfig } from './filesystem.ts';
export { getDatabaseConnector } from './persistence.ts';
export { plugRoutes } from './api/index.ts';

export async function buildInterfaces(config: ConfigFile): Promise<void> {
   await buildDatabaseConnector(config.database);
}
