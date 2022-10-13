import { cameledFieldsObjectToSnaked, Context, helpers, InputErrors, Report } from '/deps/index.ts';
import { getRoles, Role } from '/app/domains/types.ts';

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

      const obj = helpers.getQuery(ctx);
      const queryData = JSON.parse(obj.query);

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
   const auth = ctx.request.headers.get('authorization');
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
   const role = ctx.request.headers.get('user-role') as Role;
   if (role === undefined || role === null) {
      return undefined;
   }
   if (!getRoles().includes(role)) {
      return undefined;
   }
   return role;
}