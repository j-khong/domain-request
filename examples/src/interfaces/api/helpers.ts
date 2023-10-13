import { cameledFieldsObjectToSnaked, Context, helpers, InputErrors, Report, Response } from '/deps/index.ts';
import { getRoles, Role } from '@domains/types.ts';

export async function fetch(
   ctx: Context,
   domainFetch: (
      inputData: unknown,
      userData: { token: string; role: Role },
   ) => Promise<{ total: number; results: unknown[]; errors: InputErrors; persistenceReport: Report }>,
): Promise<Response> {
   try {
      const token = getToken(ctx);
      if (undefined === token) {
         throw new Error('no token');
      }
      const role = getRole(ctx);
      if (undefined === role) {
         throw new Error('unknown role');
      }

      const obj = helpers.getQuery(ctx);
      const queryData = JSON.parse(obj.query);

      const fetchedResult = await domainFetch(queryData, { token, role });

      const body = {
         total: fetchedResult.total,
         results: cameledFieldsObjectToSnaked(fetchedResult.results),
         errors: cameledFieldsObjectToSnaked(fetchedResult.errors),
      };
      const status = 200;
      return helpers.createResponse(ctx, body, status);
   } catch (e) {
      console.log(e);
      const status = 400;
      const body = { message: e.message };
      return helpers.createResponse(ctx, body, status);
   }
}

function getToken(ctx: Context): string | undefined {
   const auth = helpers.getHeader(ctx, 'authorization');
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
   const role = helpers.getHeader(ctx, 'user-role') as Role;
   if (role === undefined || role === null) {
      return undefined;
   }
   if (!getRoles().includes(role)) {
      return undefined;
   }
   return role;
}
