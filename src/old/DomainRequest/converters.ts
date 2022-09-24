// https://stackoverflow.com/questions/60269936/typescript-convert-generic-object-from-snake-to-camel-case
// type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
//    ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
//    : S;

export type CamelToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
   ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${CamelToSnakeCase<U>}`
   : S;

export function snakeToCamel<IN extends string, OUT extends string>(str: IN): OUT {
   return str.replace(/_[a-z]/g, (part) => `${part.charAt(1).toUpperCase()}`) as OUT;
}

export function camelToSnake<IN extends string, OUT extends string>(str: IN): OUT {
   return str.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`) as OUT;
}

export function cameledFieldsObjectToSnaked(inObj: any): any {
   if (inObj === undefined || inObj === null) {
      return inObj;
   }

   if (inObj.getTime !== undefined) {
      return inObj;
   } else if (Array.isArray(inObj)) {
      const outObj = [];
      for (const value of inObj) {
         outObj.push(cameledFieldsObjectToSnaked(value));
      }
      return outObj;
   } else if (typeof inObj === 'object') {
      const outObj: any = {};
      for (const key in inObj) {
         const snaked = camelToSnake(key);
         outObj[snaked] = cameledFieldsObjectToSnaked(inObj[key]);
      }
      return outObj;
   }
   return inObj;
}
