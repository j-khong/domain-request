import { Path } from '../deps/index.ts';
import { DomainRequestHandler, generateRequestsTypes, SelectMethod, SelectMethodResult } from '../index.ts';

type DataType<DomainRequestName extends string, Role extends string, DF> = {
   drn: DomainRequestName[];
   roles: Role[];
   resourceDomainMapping: Array<{ resource: string; drn: DomainRequestName }>;
};
export async function generateApiClient<DomainRequestName extends string, Role extends string, DF>(
   conf: { target: 'deno' | 'node'; destFolder: string; fetch: (url: string) => Promise<string> },
   domainRequest: {
      init: (select: SelectMethod) => void;
      getDomainRequestHandler: (name: DomainRequestName) => DomainRequestHandler<Role, DomainRequestName, DF>;
   },
   data: DataType<DomainRequestName, Role, DF>,
) {
   const { destFolder, target, fetch } = conf;
   const importExt = target === 'node' ? '' : target === 'deno' ? '.ts' : '';

   domainRequest.init((_query: string): Promise<SelectMethodResult> => {
      return new Promise((resolve, _reject) => {
         resolve([]);
      });
   });

   createFolder(conf.destFolder);
   await copyResources({ destFolder, target, importExt, fetch });
   await generateDomainsFolder({ destFolder, importExt, fetch }, data, domainRequest.getDomainRequestHandler);
   await generateClient({ destFolder, importExt }, data);
}

function createFolder(folder: string) {
   try {
      Deno.mkdirSync(folder);
   } catch (_e) {
      //
   }
}

async function copyResources(conf: {
   destFolder: string;
   importExt: string;
   target: 'deno' | 'node';
   fetch: (url: string) => Promise<string>;
}) {
   const { destFolder, target, importExt, fetch } = conf;

   let str = await fetchResourceFileContent('ApiConnection.tpl', fetch);
   str = str.replaceAll('{EXT}', importExt);

   let filename = Path.join(destFolder, 'ApiConnection.ts');
   writeFile(filename, str);

   const basename = target === 'node' ? 'NodeExample' : target === 'deno' ? 'DenoExample' : '';
   str = await fetchResourceFileContent(`${basename}.tpl`, fetch);
   filename = Path.join(destFolder, `${basename}.ts`);
   writeFile(filename, str);
}

function fetchResourceFileContent(path: string, fetch: (url: string) => Promise<string>): Promise<string> {
   let url = 'https://deno.land/x/domain_request/src/tools';

   if (import.meta.url) {
      url = Path.dirname(import.meta.url);
   }

   return fetch(Path.join(url, 'resources', path));
}

async function generateDomainsFolder<DomainRequestName extends string, Role extends string, DF>(
   conf: { destFolder: string; importExt: string; fetch: (url: string) => Promise<string> },
   data: DataType<DomainRequestName, Role, DF>,
   getDomainRequestHandler: (name: DomainRequestName) => DomainRequestHandler<Role, DomainRequestName, DF>,
) {
   const { destFolder, importExt, fetch } = conf;
   const { roles, resourceDomainMapping } = data;

   const domainsFolder = Path.join(destFolder, 'domains');
   createFolder(domainsFolder);

   // copy Error file
   let content = await fetchResourceFileContent('Error.ts', fetch);
   let filename = Path.join(domainsFolder, 'Error.ts');
   writeFile(filename, content);

   // copy QueryResult file
   content = await fetchResourceFileContent('QueryResult.ts', fetch);
   filename = Path.join(domainsFolder, 'QueryResult.ts');
   writeFile(filename, content);

   // gen Roles file
   const rolesDef = `export type Role = ${roles.map((v) => `"${v}"`).join('|')};`;
   filename = Path.join(domainsFolder, 'Role.ts');
   writeFile(filename, rolesDef);

   // gen requests
   const requestsFolder = Path.join(domainsFolder, 'requests');
   createFolder(requestsFolder);

   await genRequests(
      { destFolder: requestsFolder, importExt },
      {
         drn: resourceDomainMapping.map((v) => v.drn),
         roles,
         getDomainRequestHandler,
      },
   );
}

async function generateClient<DomainRequestName extends string, Role extends string, DF>(
   conf: { destFolder: string; importExt: string },
   data: DataType<DomainRequestName, Role, DF>,
) {
   const { destFolder, importExt } = conf;
   const { resourceDomainMapping } = data;

   const domainRoleFileName = Path.join(destFolder, 'index.ts');

   const genDomainImport = (drn: DomainRequestName) => {
      const name = createDomainRequestObjectName(drn);
      return `import {${name}} from "./domains/requests/${drn}/index${importExt}"`;
   };

   const imports: string[] = [
      `import { ApiConnection } from './ApiConnection${importExt}';`,
      `import {QueryResult} from "./domains/QueryResult${importExt}"`,
   ];
   imports.push(...resourceDomainMapping.map((n) => genDomainImport(n.drn)));

   const genFetch = (data: { resource: string; drn: DomainRequestName }) => {
      return `fetch${toPascalCase(data.drn)}(query: ${createDomainRequestObjectName(data.drn)}): Promise<QueryResult> {
         const resource = '${data.resource}';
         return this.conn.process(resource, query);
      }`;
   };

   const content = `
   ${imports.join(';')}
   export class QueryApi {
      constructor(private readonly conn: ApiConnection) {}

      ${resourceDomainMapping.map((n) => genFetch(n)).join('\n')}
   }`;
   await writeFile(domainRoleFileName, content);
}

// const encoder = new TextEncoder();
async function writeFile(filename: string, str: string) {
   // const data = encoder.encode(str);
   await Deno.writeTextFile(filename, str);
}

async function genRequests<DomainRequestName extends string, Role extends string, DF>(
   conf: { destFolder: string; importExt: string },
   data: {
      drn: DomainRequestName[];
      roles: Role[];
      getDomainRequestHandler: (name: DomainRequestName) => DomainRequestHandler<Role, DomainRequestName, DF>;
   },
) {
   const { destFolder, importExt } = conf;
   const { drn, roles, getDomainRequestHandler } = data;

   const files = generateRequestsTypes(drn, roles, getDomainRequestHandler);
   const indexFiles: string[] = [];
   for (const [domainName, typeForRoles] of files) {
      const domainFolderName = Path.join(destFolder, domainName);
      createFolder(domainFolderName);
      const typesToImport: string[] = [];
      for (const role of roles) {
         const typeName = `${createDomainRequestObjectName(domainName)}By${toPascalCase(role)}`;
         typesToImport.push(typeName);
         const filename = `${typeName}.ts`;
         const domainRoleFileName = Path.join(domainFolderName, filename);
         const content = `export type ${typeName}=${typeForRoles[role]}`;
         await writeFile(domainRoleFileName, content);
      }

      // generate domain index barrel
      const superType = createDomainRequestObjectName(domainName);
      const content = `
         ${typesToImport.map((v) => `import {${v}} from './${v}${importExt}';`).join('')}
         ${typesToImport.map((v) => `export type {${v}} from './${v}${importExt}';`).join('')}
         export type ${superType} = ${typesToImport.join('|')}`;

      indexFiles.push(`${domainName}/index`);
      await writeFile(Path.join(domainFolderName, 'index.ts'), content);
   }

   // generate main index barrel
   const content = `${indexFiles.map((v) => `export * from './${v}${importExt}';`).join('')}`;
   await writeFile(Path.join(destFolder, 'index.ts'), content);
}

function toPascalCase(role: string) {
   const split: string[] = role.split('-');
   return split.map((v: string) => capitalize(v)).join('');
}

function capitalize(s: string): string {
   if (typeof s !== 'string') return '';
   return s.charAt(0).toUpperCase() + s.slice(1);
}

function createDomainRequestObjectName<DomainRequestName extends string>(drn: DomainRequestName): string {
   const name = toPascalCase(drn);
   return `${name}Request`;
}
