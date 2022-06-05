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
