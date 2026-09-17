/**
 * D1 query helpers — thin wrappers around D1Database to keep query modules clean.
 */

export type DB = D1Database;

/** Run a statement and return all rows typed as T. */
export async function dbAll<T>(db: DB, query: string, ...params: unknown[]): Promise<T[]> {
  const stmt = db.prepare(query);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  const result = await bound.all<T>();
  return result.results;
}

/** Run a statement and return the first row typed as T, or null. */
export async function dbFirst<T>(
  db: DB,
  query: string,
  ...params: unknown[]
): Promise<T | null> {
  const stmt = db.prepare(query);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  return bound.first<T>();
}

/** Run a write statement (INSERT / UPDATE / DELETE). Returns meta. */
export async function dbRun(
  db: DB,
  query: string,
  ...params: unknown[]
): Promise<D1Result> {
  const stmt = db.prepare(query);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  return bound.run();
}

/** Execute multiple statements in a batch (atomic). */
export async function dbBatch(
  db: DB,
  statements: D1PreparedStatement[]
): Promise<D1Result[]> {
  return db.batch(statements);
}

/** Prepare a statement for use in a batch. */
export function dbPrepare(db: DB, query: string, ...params: unknown[]): D1PreparedStatement {
  const stmt = db.prepare(query);
  return params.length > 0 ? stmt.bind(...params) : stmt;
}

/** Generate a UUID v4. Uses Web Crypto — available in Workers. */
export function newId(): string {
  return crypto.randomUUID();
}

/** Current UTC timestamp as ISO 8601 string. */
export function now(): string {
  return new Date().toISOString();
}

/** Calculate pagination offset. */
export function offset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}
