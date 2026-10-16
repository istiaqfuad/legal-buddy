import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@ep-dummy.aws.neon.tech/neondb');

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  // Upsert profile on first access
  const rows = await sql`
    INSERT INTO user_profiles (auth_user_id)
    VALUES (${userId})
    ON CONFLICT (auth_user_id) DO NOTHING
    RETURNING *
  `;

  const profile = rows[0] ?? (await sql`SELECT * FROM user_profiles WHERE auth_user_id = ${userId}`)[0];

  return NextResponse.json({
    user: session.user,
    profile,
  });
}
