/** sql dialect of the database which executes the generated requests */
export type Dialect = 'mysql' | 'postgres' | 'sqlite';

export const defaultDialect: Dialect = 'mysql';
