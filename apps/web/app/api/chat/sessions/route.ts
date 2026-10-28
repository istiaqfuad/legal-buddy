import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createSession, listSessions } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to view your conversations.' }, { status: 401 });
  }

  const sessions = await listSessions(user.id);
  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to start a conversation.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rawTitle = typeof body.title === 'string' ? body.title.trim() : '';
  const title = rawTitle ? rawTitle.slice(0, 100) : 'New conversation';

  const session = await createSession(user.id, title);
  return NextResponse.json({ session }, { status: 201 });
}
