import { assertEquals /*, assertStrictEquals, assertThrows*/ } from 'https://deno.land/std@0.149.0/testing/asserts.ts';
import { getDomainRequestHandler } from '../domain-requests/init.ts';
import { DomainRequestName, Role } from '../domain-requests/types.ts';

export interface Expected {
   total: number;
   results: any[];
}

export async function test(
   input: any,
   role: Role,
   domainRequestName: DomainRequestName,
   expected: Expected,
): Promise<void> {
   const handler = getDomainRequestHandler(domainRequestName);
   const domainRequestBuilder = handler.getRoleDomainRequestBuilder(role);
   const buildResult = domainRequestBuilder.build(input);
   const result = await handler.fetchDomain(buildResult.request);

   assertEquals(result.domainName, domainRequestName);
   assertEquals(result.total, expected.total);
   assertEquals(result.results, expected.results);
}

export async function testSpecial(
   input: any,
   role: Role,
   domainRequestName: DomainRequestName,
   expected: Expected,
): Promise<void> {
   const handler = getDomainRequestHandler(domainRequestName);
   const domainRequestBuilder = handler.getRoleDomainRequestBuilder(role);
   const buildResult = domainRequestBuilder.build(input);
   const result = await handler.fetchDomain(buildResult.request);

   assertEquals(result.domainName, domainRequestName);
   assertEquals(result.total, expected.total);
   if (!compareObjects(result.results, expected.results)) {
      assertEquals(result.results, expected.results);
   }
}

function compareObjects(o: any, p: any): boolean {
   let i;
   const keysO = Object.keys(o).sort();
   const keysP = Object.keys(p).sort();
   if (keysO.length !== keysP.length) {
      console.error('keysO.length !== keysP.length:', keysO.length, keysP.length);
      return false; //not the same nr of keys
   }
   if (keysO.join('') !== keysP.join('')) {
      console.error('keysO.join() !== keysP.join():', keysO.join(''), keysP.join(''));
      return false; //different keys
   }
   for (i = 0; i < keysO.length; ++i) {
      const oElem = o[keysO[i]];
      const pElem = p[keysO[i]];
      if (oElem instanceof Array) {
         if (!(pElem instanceof Array)) {
            console.error('not array)');
            return false;
         }
         for (let j = 0; j < oElem.length; j++) {
            if (!compareObjects(oElem[j], pElem[j])) {
               console.error('object in array not equals');
               return false;
            }
         }
      } else if (oElem instanceof Date) {
         if (!(pElem instanceof Date)) {
            console.error('not a date');
            return false;
         }
         if ('' + oElem !== '' + pElem) {
            console.error('diff dates');
            return false;
         }
      } else if (oElem instanceof Function) {
         if (!(pElem instanceof Function)) {
            console.error('not Function:');
            return false;
         }
         //ignore functions, or check them regardless?
      } else if (oElem instanceof Object) {
         if (!(pElem instanceof Object)) {
            console.error('not object:');
            return false;
         }
         if (oElem === o) {
            //self reference?
            if (pElem !== p) {
               console.error('selft ref:');
               return false;
            }
         } else if (compareObjects(oElem, pElem) === false) {
            console.error('WARNING:'); //, JSON.stringify(oElem, null, 2), JSON.stringify(pElem, null, 2));
            return false; //WARNING: does not deal with circular refs other than ^^
         }
      } else if (oElem !== pElem) {
         console.error('oElem !== pElem:', Array.isArray(oElem), oElem, pElem);
         //change !== to != for loose comparison
         console.error('//change !== to != for loose comparison:');
         return false; //not the same value
      }
   }
   return true;
}
