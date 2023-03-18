import {Context} from 'koa';
import { cameledFieldsObjectToSnaked ,InputErrors, Report, RequestableFields } from '@jkhong/domain-request';
import { getRoles, Role } from '@domains/types';

export async function fetch(
   ctx: Context,
   domainFetch: (
      inputData: unknown,
      userData: { token: string; role: Role },
   ) => Promise<{ total: number; results: unknown[]; errors: InputErrors; persistenceReport: Report }>,
): Promise<void> {
   const { response } = ctx;
   try {
      const token = getToken(ctx);
      if (undefined === token) {
         throw new Error('no token');
      }
      const role = getRole(ctx);
      if (undefined === role) {
         throw new Error('unknown role');
      }

      const obj = ctx.request.query;
      const queryData = JSON.parse(obj.query as string);

      const fetchedResult = await domainFetch(queryData, { token, role });

      response.body = {
         total: fetchedResult.total,
         results: cameledFieldsObjectToSnaked(fetchedResult.results),
         errors: cameledFieldsObjectToSnaked(fetchedResult.errors),
      };
      response.status = 200;
   } catch (e) {
      console.log(e);
      response.status = 400;
      response.body = { message: e.message };
   }
}

function getToken(ctx: Context): string | undefined {
   const auth = ctx.request.headers.authorization
   if (auth === undefined || auth === null || auth === '' || !auth.includes('Bearer')) {
      return undefined;
   }
   const split = auth.split(' ');
   if (split.length !== 2) {
      return undefined;
   }
   return split[1];
}

function getRole(ctx: Context): Role | undefined {
   const role = ctx.request.headers['user-role'] as Role;
   if (role === undefined || role === null) {
      return undefined;
   }
   if (!getRoles().includes(role)) {
      return undefined;
   }
   return role;
}
