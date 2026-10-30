import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from './index';
import {
  chatMessages,
  chatSessions,
  documents,
  queryLimits,
  userProfiles,
} from './schema';
import type { Source } from '../types';

function toIso(value: Date | string | null): string {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : value;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Postgres will reject malformed UUIDs before we can return a clean 404. */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function getOrCreateProfile(userId: string) {
  const { db } = getDb();
  const [inserted] = await db
    .insert(userProfiles)
    .values({ authUserId: userId })
    .onConflictDoNothing({ target: userProfiles.authUserId })
    .returning();

  if (inserted) return inserted;

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.authUserId, userId))
    .limit(1);

  return profile ?? null;
}

export async function getProfile(userId: string) {
  const { db } = getDb();
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.authUserId, userId))
    .limit(1);
  return profile ?? null;
}

// ---------------------------------------------------------------------------
// Chat sessions
// ---------------------------------------------------------------------------

export interface SessionSummary {
  id: string;
  title: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  message_count: number;
}

export async function listSessions(userId: string): Promise<SessionSummary[]> {
  const { db } = getDb();
  const rows = await db
    .select({
      id: chatSessions.id,
      title: chatSessions.title,
      status: chatSessions.status,
      createdAt: chatSessions.createdAt,
      updatedAt: chatSessions.updatedAt,
      messageCount:
        sql<number>`(select count(*)::int from ${chatMessages} where ${chatMessages.sessionId} = ${chatSessions.id})`,
    })
    .from(chatSessions)
    .where(and(eq(chatSessions.userId, userId), eq(chatSessions.status, 'active')))
    .orderBy(desc(chatSessions.updatedAt))
    .limit(50);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    created_at: toIso(row.createdAt),
    updated_at: toIso(row.updatedAt),
    message_count: Number(row.messageCount ?? 0),
  }));
}

export async function createSession(userId: string, title: string) {
  const { db } = getDb();
  const [row] = await db
    .insert(chatSessions)
    .values({ userId, title: title.slice(0, 100) || 'New conversation' })
    .returning({
      id: chatSessions.id,
      title: chatSessions.title,
      status: chatSessions.status,
      created_at: chatSessions.createdAt,
      updated_at: chatSessions.updatedAt,
    });

  return {
    ...row,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };
}

export async function findSession(userId: string, sessionId: string) {
  if (!isUuid(sessionId)) return null;
  const { db } = getDb();
  const [row] = await db
    .select()
    .from(chatSessions)
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)))
    .limit(1);
  return row ?? null;
}

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: Source[] | null;
  created_at: string;
}

export async function listMessages(sessionId: string): Promise<StoredMessage[]> {
  const { db } = getDb();
  const rows = await db
    .select({
      id: chatMessages.id,
      role: chatMessages.role,
      content: chatMessages.content,
      sources: chatMessages.sources,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);

  return rows.map((row) => ({
    id: row.id,
    role: row.role === 'assistant' ? 'assistant' : 'user',
    content: row.content,
    sources: (row.sources as Source[] | null) ?? null,
    created_at: toIso(row.createdAt),
  }));
}

export async function getSessionWithMessages(userId: string, sessionId: string) {
  const session = await findSession(userId, sessionId);
  if (!session) return null;
  const messages = await listMessages(sessionId);
  return {
    session: {
      id: session.id,
      title: session.title,
      status: session.status,
      created_at: toIso(session.createdAt),
      updated_at: toIso(session.updatedAt),
      messages,
    },
  };
}

export async function appendMessage(input: {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[] | null;
}) {
  const { db } = getDb();
  const [row] = await db
    .insert(chatMessages)
    .values({
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      sources: input.sources ?? null,
    })
    .returning({
      id: chatMessages.id,
      role: chatMessages.role,
      content: chatMessages.content,
      sources: chatMessages.sources,
      createdAt: chatMessages.createdAt,
    });

  return {
    id: row.id,
    role: row.role,
    content: row.content,
    sources: row.sources,
    created_at: toIso(row.createdAt),
  };
}

export async function appendTurn(input: {
  sessionId: string;
  question: string;
  answer: string;
  sources: Source[];
}) {
  const userMessage = await appendMessage({
    sessionId: input.sessionId,
    role: 'user',
    content: input.question,
  });
  const assistantMessage = await appendMessage({
    sessionId: input.sessionId,
    role: 'assistant',
    content: input.answer,
    sources: input.sources,
  });

  const { db } = getDb();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatMessages)
    .where(and(eq(chatMessages.sessionId, input.sessionId), eq(chatMessages.role, 'user')));

  if (Number(count) === 1) {
    await db
      .update(chatSessions)
      .set({ title: input.question.slice(0, 100), updatedAt: new Date() })
      .where(eq(chatSessions.id, input.sessionId));
  } else {
    await touchSession(input.sessionId);
  }

  return { userMessage, assistantMessage };
}

export async function touchSession(sessionId: string) {
  const { db } = getDb();
  await db
    .update(chatSessions)
    .set({ updatedAt: new Date() })
    .where(eq(chatSessions.id, sessionId));
}

export async function deleteSession(userId: string, sessionId: string) {
  const session = await findSession(userId, sessionId);
  if (!session) return false;
  const { db } = getDb();
  await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));
  return true;
}

// ---------------------------------------------------------------------------
// Usage limits
// ---------------------------------------------------------------------------

export interface Usage {
  count: number;
  date: string;
}

export async function getCurrentUsage(userId: string): Promise<Usage> {
  const today = new Date().toISOString().slice(0, 10);
  const { db } = getDb();
  const [row] = await db
    .select({ count: queryLimits.count })
    .from(queryLimits)
    .where(and(eq(queryLimits.userId, userId), eq(queryLimits.date, today)))
    .limit(1);
  return { count: row?.count ?? 0, date: today };
}

/**
 * Atomically increments today's count only when the user is still under the
 * limit. Returns null when the limit has been reached.
 */
export async function incrementUsageWithinLimit(userId: string, limit: number) {
  const today = new Date().toISOString().slice(0, 10);
  const { sql: neonSql } = getDb();
  const rows = await neonSql`
    INSERT INTO query_limits (user_id, date, count)
    VALUES (${userId}, ${today}, 1)
    ON CONFLICT (user_id, date) DO UPDATE
      SET count = query_limits.count + 1
      WHERE query_limits.count < ${limit}
    RETURNING count
  `;
  return rows[0]?.count ? Number(rows[0].count) : null;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export interface StoredDocument {
  id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  storage_key: string;
  created_at: string;
}

export async function listDocuments(userId: string): Promise<StoredDocument[]> {
  const { db } = getDb();
  const rows = await db
    .select({
      id: documents.id,
      name: documents.name,
      mimeType: documents.mimeType,
      sizeBytes: documents.sizeBytes,
      storageKey: documents.storageKey,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    mime_type: row.mimeType,
    size_bytes: row.sizeBytes,
    storage_key: row.storageKey,
    created_at: toIso(row.createdAt),
  }));
}

export async function createDocument(input: {
  userId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
}) {
  const { db } = getDb();
  const [row] = await db
    .insert(documents)
    .values(input)
    .returning({
      id: documents.id,
      name: documents.name,
      mimeType: documents.mimeType,
      sizeBytes: documents.sizeBytes,
      storageKey: documents.storageKey,
      createdAt: documents.createdAt,
    });

  return {
    id: row.id,
    name: row.name,
    mime_type: row.mimeType,
    size_bytes: row.sizeBytes,
    storage_key: row.storageKey,
    created_at: toIso(row.createdAt),
  };
}

export async function findDocument(userId: string, documentId: string) {
  if (!isUuid(documentId)) return null;
  const { db } = getDb();
  const [row] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function deleteDocumentRecord(userId: string, documentId: string) {
  const document = await findDocument(userId, documentId);
  if (!document) return null;
  const { db } = getDb();
  await db.delete(documents).where(eq(documents.id, documentId));
  return document;
}
