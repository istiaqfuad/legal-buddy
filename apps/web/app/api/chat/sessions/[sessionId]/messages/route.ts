import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { appendMessage, findSession, listMessages, touchSession } from '@/lib/db/queries';
import type { Source } from '@/lib/types';

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
  const session = await findSession(user.id, sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  }

  const messages = await listMessages(sessionId);
  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to add a message.' }, { status: 401 });
  }

  const { sessionId } = await params;
  const session = await findSession(user.id, sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const role = record.role === 'assistant' ? 'assistant' : record.role === 'user' ? 'user' : null;
  const content = typeof record.content === 'string' ? record.content.trim() : '';

  if (!role || !content) {
    return NextResponse.json({ error: 'role and content are required.' }, { status: 400 });
  }

  const sources = Array.isArray(record.sources) ? (record.sources as Source[]) : null;
  const message = await appendMessage({ sessionId, role, content, sources });
  await touchSession(sessionId);

  return NextResponse.json({ message }, { status: 201 });
}
