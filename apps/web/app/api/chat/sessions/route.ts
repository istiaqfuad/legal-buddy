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

  const sessions = await sql`
    SELECT id, title, status, created_at, updated_at,
      (SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.id) as message_count
    FROM chat_sessions cs
    WHERE user_id = ${userId} AND status = 'active'
    ORDER BY updated_at DESC
    LIMIT 50
  `;

  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === 'string' ? body.title.slice(0, 100) : 'New conversation';

  const rows = await sql`
    INSERT INTO chat_sessions (user_id, title)
    VALUES (${userId}, ${title})
    RETURNING id, title, status, created_at
  `;

  return NextResponse.json({ session: rows[0] }, { status: 201 });
}
