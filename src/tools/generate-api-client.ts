import { Path } from '../deps/index.ts';
import { DomainRequestHandler, generateRequestsTypes, SelectMethod, SelectMethodResult } from '../index.ts';

type DataType<DomainRequestName extends string, Role extends string, DF> = {
   drn: DomainRequestName[];
   roles: Role[];
   resourceDomainMapping: Array<{ resource: string; drn: DomainRequestName }>;
};
export async function generateApiClient<DomainRequestName extends string, Role extends string, DF>(
   conf: { target: 'deno' | 'node'; destFolder: string },
   domainRequest: {
      init: (select: SelectMethod) => void;
      getDomainRequestHandler: (name: DomainRequestName) => DomainRequestHandler<Role, DomainRequestName, DF>;
   },
   data: DataType<DomainRequestName, Role, DF>,
) {
   const { destFolder, target } = conf;
   const importExt = target === 'node' ? '' : target === 'deno' ? '.ts' : '';

   domainRequest.init((_query: string): Promise<SelectMethodResult> => {
      return new Promise((resolve, _reject) => {
         resolve([]);
      });
   });

   createFolder(conf.destFolder);
   await copyResources({ destFolder, importExt });
   await generateDomainsFolder({ destFolder, importExt }, data, domainRequest.getDomainRequestHandler);
   await generateClient({ destFolder, importExt }, data);
}

function createFolder(folder: string) {
   try {
      Deno.mkdirSync(folder);
   } catch (_e) {
      //
   }
}

async function copyResources(conf: { destFolder: string; importExt: string }) {
   const { destFolder, importExt } = conf;

   let str = await Deno.readTextFile(joinPath(getCurrentFilePath(), 'resources/Query.tpl'));
   str = str.replaceAll('{EXT}', importExt);

   const filename = Path.join(destFolder, 'Query.ts');
   writeFile(filename, str);
}

async function generateDomainsFolder<DomainRequestName extends string, Role extends string, DF>(
   conf: { destFolder: string; importExt: string },
   data: DataType<DomainRequestName, Role, DF>,
   getDomainRequestHandler: (name: DomainRequestName) => DomainRequestHandler<Role, DomainRequestName, DF>,
) {
   const { destFolder, importExt } = conf;
   const { roles, resourceDomainMapping } = data;

   const domainsFolder = Path.join(destFolder, 'domains');
   createFolder(domainsFolder);
   // copy Error file
   await Deno.copyFile(joinPath(getCurrentFilePath(), 'resources/Error.ts'), Path.join(domainsFolder, 'Error.ts'));
   // copy QueryResult file
   await Deno.copyFile(
      joinPath(getCurrentFilePath(), 'resources/QueryResult.ts'),
      Path.join(domainsFolder, 'QueryResult.ts'),
   );
   // gen Roles file
   const rolesDef = `export type Role = ${roles.map((v) => `"${v}"`).join('|')};`;
   const filename = Path.join(domainsFolder, 'Role.ts');
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
      `import {Query} from "./Query${importExt}"`,
      `import {Role} from "./domains/Role${importExt}"`,
      `import {QueryResult} from "./domains/QueryResult${importExt}"`,
   ];
   imports.push(...resourceDomainMapping.map((n) => genDomainImport(n.drn)));

   const genFetch = (data: { resource: string; drn: DomainRequestName }) => {
      return `fetch${toPascalCase(data.drn)}(query: ${createDomainRequestObjectName(data.drn)}): Promise<QueryResult> {
         const resource = '${data.resource}';
         return this.query.process(resource, query);
      }`;
   };

   const content = `
   ${imports.join(';')}
   export class QueryApi {
      private query: Query;
      constructor(url: string) { this.query=new Query(url); }
      init(v: { token: string; role: Role }) { this.query.init(v); }

      ${resourceDomainMapping.map((n) => genFetch(n)).join('\n')}
   }`;
   await writeFile(domainRoleFileName, content);
}

// const encoder = new TextEncoder();
async function writeFile(filename: string, str: string) {
   // const data = encoder.encode(str);
   await Deno.writeTextFile(filename, str);
}

function joinPath(folder: string, s: string): string {
   const arr = s.split('/');
   return Path.join(folder, ...arr);
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

function getCurrentFilePath(): string {
   if (import.meta.url) {
      return Path.dirname(Path.fromFileUrl(import.meta.url));
   }
   return '.';
}
