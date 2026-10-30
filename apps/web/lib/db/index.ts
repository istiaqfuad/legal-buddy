import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * The web app and the Python API both use the same Neon database, but they
 * were documented with different variable names. Accept either so a deployment
 * that only defines POSTGRES_CONNECTION_STRING still works.
 */
function readConnectionString(): string | null {
  const raw = process.env.DATABASE_URL ?? process.env.POSTGRES_CONNECTION_STRING ?? '';
  let value = raw.trim();

  // Values copied from dashboards often keep their surrounding quotes.
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }

  return value.length > 0 ? value : null;
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      'Database is not configured for the web service. Set DATABASE_URL (or POSTGRES_CONNECTION_STRING) in the deployment environment.',
    );
    this.name = 'DatabaseNotConfiguredError';
  }
}

let cached: {
  db: ReturnType<typeof drizzle<typeof schema>>;
  sql: NeonQueryFunction<false, false>;
} | null = null;

export function isDatabaseConfigured(): boolean {
  return readConnectionString() !== null;
}

/**
 * Lazily create the client. Keeping this out of module scope means `next build`
 * never needs database credentials, and a missing runtime value produces a
 * clear error instead of a confusing `fetch failed` against a dummy host.
 */
export function getDb() {
  if (cached) return cached;

  const connectionString = readConnectionString();
  if (!connectionString) throw new DatabaseNotConfiguredError();

  let sql: NeonQueryFunction<false, false>;
  try {
    sql = neon(connectionString);
  } catch {
    // The driver's error text can include the connection string (and password),
    // so replace it with a safe message.
    throw new Error(
      'DATABASE_URL is not a valid Postgres connection string. Check the value in the deployment environment.',
    );
  }

  const created = { db: drizzle(sql, { schema }), sql };
  cached = created;
  return created;
}
