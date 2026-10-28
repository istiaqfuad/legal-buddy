import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { deleteSession, getSessionWithMessages } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to view this conversation.' }, { status: 401 });
  }

  const { sessionId } = await params;
  const result = await getSessionWithMessages(user.id, sessionId);
  if (!result) {
    return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to manage conversations.' }, { status: 401 });
  }

  const { sessionId } = await params;
  const deleted = await deleteSession(user.id, sessionId);
  if (!deleted) {
    return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
