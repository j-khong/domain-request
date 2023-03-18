import { ConfigFile } from '@domains/ConfigurationFile';
import { buildDatabaseConnector } from './persistence';
export { getConfigFile, loadConfig } from './filesystem';
export { getDatabaseConnector } from './persistence';
export { plugRoutes } from './api';

export async function buildInterfaces(config: ConfigFile): Promise<void> {
   await buildDatabaseConnector(config.database);
}
