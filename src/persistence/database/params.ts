export type SqlParam = string | number | boolean;

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const tokenRegex = /\{\{drp:((?:[0-9a-f]{2})+)\}\}/g;

/**
 * Wraps a value in a token to embed in a sql fragment in place of the value itself.
 * The token only contains hexadecimal characters, so the value can never be interpreted as sql.
 * Tokens are swapped for "?" placeholders by extractSqlParams, just before the request is executed.
 */
export function createSqlParam(value: SqlParam): string {
   const bytes = encoder.encode(JSON.stringify(value));
   let hex = '';
   for (const byte of bytes) {
      hex += byte.toString(16).padStart(2, '0');
   }
   return `{{drp:${hex}}}`;
}

/**
 * Replaces every token created by createSqlParam with a "?" placeholder
 * @returns the sql to execute and the values to bind, in the order of the placeholders
 */
export function extractSqlParams(sql: string): { sql: string; params: SqlParam[] } {
   const params: SqlParam[] = [];
   const parameterized = sql.replace(tokenRegex, (_token: string, hex: string) => {
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < bytes.length; i++) {
         bytes[i] = Number.parseInt(hex.substring(i * 2, i * 2 + 2), 16);
      }
      params.push(JSON.parse(decoder.decode(bytes)));
      return '?';
   });
   return { sql: parameterized, params };
}
