import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@ep-dummy.aws.neon.tech/neondb');

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { sessionId } = await params;
  const userId = session.user.id;

  // Verify ownership
  const owns = await sql`
    SELECT id FROM chat_sessions WHERE id = ${sessionId} AND user_id = ${userId}
  `;
  if (!owns.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const messages = await sql`
    SELECT id, role, content, sources, created_at
    FROM chat_messages
    WHERE session_id = ${sessionId}
    ORDER BY created_at ASC
  `;

  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { sessionId } = await params;
  const userId = session.user.id;

  const owns = await sql`
    SELECT id FROM chat_sessions WHERE id = ${sessionId} AND user_id = ${userId}
  `;
  if (!owns.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const { role, content, sources } = body;

  if (!role || !content) {
    return NextResponse.json({ error: 'role and content required' }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO chat_messages (session_id, role, content, sources)
    VALUES (${sessionId}, ${role}, ${content}, ${sources ? JSON.stringify(sources) : null})
    RETURNING id, role, content, sources, created_at
  `;

  // Update session timestamp and title if first user message
  if (role === 'user') {
    const count = await sql`SELECT COUNT(*) as c FROM chat_messages WHERE session_id = ${sessionId} AND role = 'user'`;
    if (Number(count[0]?.c) === 1) {
      const title = content.slice(0, 80);
      await sql`UPDATE chat_sessions SET title = ${title}, updated_at = NOW() WHERE id = ${sessionId}`;
    } else {
      await sql`UPDATE chat_sessions SET updated_at = NOW() WHERE id = ${sessionId}`;
    }
  }

  return NextResponse.json({ message: rows[0] }, { status: 201 });
}
