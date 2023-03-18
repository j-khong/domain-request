import https from 'https';
import http from 'http';
import { Role } from './domains/Role';
import { ApiConnection } from './ApiConnection';

export class NodeExample extends ApiConnection {
   private token?: string;
   private role?: Role;
   constructor(url: string) {
      super(url);
   }

   init(v: { token: string; role: Role }) {
      this.token = v.token;
      this.role = v.role;
   }

   fetch(url: string): Promise<string> {
      return new Promise(async (resolve, reject) => {
         const urlObj = new URL(url);
         fetch(
            {
               method: 'GET',
               protocol: urlObj.protocol,
               hostname: urlObj.hostname,
               port: urlObj.port,
               path: `${urlObj.pathname}${urlObj.search}`,
               headers: this.buildHeaders(),
            },
            (str) => resolve(str),
            (e) => reject(e),
         );
      });
   }

   private buildHeaders(): Record<string, string> {
      if (this.token === undefined || this.role === undefined) {
         throw new Error('please init API connector with token and user role');
      }
      return {
         'Cache-Control': 'no-cache, no-store, must-revalidate',
         Pragma: 'no-cache',
         Expires: '0',
         Accept: 'application/json',
         'Content-Type': 'application/json',
         Authorization: `Bearer ${this.token}`,
         'user-role': this.role,
      };
   }
}

function fetch(
   options: http.RequestOptions,
   onIncomingData: (str: string) => void,
   onRequestError: (e: Error) => void,
): void {
   const request = options.protocol === 'http:' ? http.request : https.request;
   const req = request(options, function (res: http.IncomingMessage) {
      const chunks: Uint8Array[] = [];

      res.on('data', function (chunk: Uint8Array) {
         chunks.push(chunk);
      });

      res.on('end', function () {
         const body = Buffer.concat(chunks);
         onIncomingData(body.toString());
      });
   });

   req.on('error', (err: Error) => {
      onRequestError(err);
   });

   req.end();
}
