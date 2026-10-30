import { NextResponse } from 'next/server';
import { getDb, isDatabaseConfigured } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Deployment health check for the web database connection. Never returns the
 * connection string or driver details — only whether the query succeeded.
 */
export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        code: 'database_not_configured',
        message:
          'Set DATABASE_URL (or POSTGRES_CONNECTION_STRING) in the web service environment, then redeploy.',
      },
      { status: 503 },
    );
  }

  try {
    const { sql } = getDb();
    await sql`select 1`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: 'database_unreachable',
        message:
          'The web service could not reach Postgres. Check DATABASE_URL and outbound network access.',
      },
      { status: 503 },
    );
  }
}
