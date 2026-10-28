import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { appendTurn, findSession, getOrCreateProfile } from '@/lib/db/queries';
import { checkAndIncrementLimit } from '@/lib/rate-limit';
import type { Source } from '@/lib/types';

export const dynamic = 'force-dynamic';

const API_URL = process.env.API_URL ?? 'http://api:8000';
const CONNECT_TIMEOUT_MS = 120_000;

type Msg = { role: 'user' | 'assistant'; content: string };

function parseHistory(raw: unknown): Msg[] {
  if (!Array.isArray(raw)) return [];
  const out: Msg[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    if (typeof rec.content !== 'string') continue;
    out.push({
      role: rec.role === 'assistant' ? 'assistant' : 'user',
      content: rec.content,
    });
  }
  return out;
}

// FastAPI errors come back as { detail: string | [{ msg, ... }] }.
function extractDetail(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (d && typeof d === 'object' && 'msg' in d ? String(d.msg) : String(d)))
      .join('; ');
  }
  return null;
}

export async function POST(request: Request) {
  // 1. Auth check
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to use LegalBuddy.' }, { status: 401 });
  }

  // 2. Parse and validate the request before consuming a daily query.
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) {
    return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
  }

  const rawSessionId =
    typeof body.session_id === 'string'
      ? body.session_id
      : typeof body.sessionId === 'string'
        ? body.sessionId
        : null;

  // A supplied session must belong to the caller. This prevents one user from
  // appending messages to another user's conversation.
  if (rawSessionId) {
    const ownedSession = await findSession(user.id, rawSessionId);
    if (!ownedSession) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }
  }
  const sessionId = rawSessionId;

  // 3. Rate limit (atomic increment, capped at the tier limit).
  const profile = await getOrCreateProfile(user.id);
  const tier = profile?.subscriptionTier ?? 'free';
  const usage = await checkAndIncrementLimit(user.id, tier);
  if (!usage.allowed) {
    return NextResponse.json(
      {
        error: `You have used all ${usage.limit} answers available today. Try again tomorrow or upgrade for more.`,
      },
      { status: 429 },
    );
  }

  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
  const history = parseHistory(body.history);

  const provider =
    body.provider === 'gemini' || body.provider === 'groq' || body.provider === 'openai'
      ? body.provider
      : undefined;
  const model =
    typeof body.model === 'string' && body.model.trim() ? body.model.trim() : undefined;

  // 4. Forward to FastAPI with an abort timeout.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);

  try {
    const upstream = await fetch(`${API_URL}/rag/legal/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        history,
        top_k: num(body.top_k),
        provider,
        model,
        temperature: num(body.temperature),
        max_tokens: num(body.max_tokens),
        clarify_score_floor: num(body.clarify_score_floor),
        low_confidence_floor: num(body.low_confidence_floor),
      }),
      signal: controller.signal,
    });

    if (!upstream.ok || !upstream.body) {
      const payload = await upstream.json().catch(() => null);
      const detail = extractDetail(payload) ?? `Request failed (${upstream.status}).`;
      return NextResponse.json({ error: detail }, { status: upstream.status || 502 });
    }

    // 5. Tee the stream: one copy for the client, one to capture for persistence.
    let fullAnswer = '';
    let sources: Source[] = [];

    const [streamForClient, streamForCapture] = upstream.body.tee();

    // Non-blocking: parse the capture copy and save the turn when complete.
    (async () => {
      try {
        const reader = streamForCapture.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let sep: number;
          while ((sep = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            let event = 'message';
            const dataLines: string[] = [];
            for (const line of frame.split('\n')) {
              if (line.startsWith('event:')) event = line.slice(6).trim();
              else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
            }
            if (dataLines.length) {
              try {
                const data = JSON.parse(dataLines.join('\n'));
                if (event === 'sources' && Array.isArray(data.sources)) {
                  sources = data.sources as Source[];
                } else if (event === 'delta' && typeof data.text === 'string') {
                  fullAnswer += data.text;
                }
              } catch {
                // Ignore malformed events; the client copy is unaffected.
              }
            }
          }
        }

        if (sessionId && fullAnswer) {
          await appendTurn({ sessionId, question, answer: fullAnswer, sources });
        }
      } catch (error) {
        // Persistence is best-effort; never break the response the user is reading.
        console.error('Failed to persist streamed answer', error);
      }
    })();

    return new Response(streamForClient, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-User-Tier': tier,
        'X-Queries-Used': String(usage.used),
        'X-Queries-Limit': String(usage.limit),
      },
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      {
        error: aborted
          ? 'The request timed out. Please try again.'
          : 'Could not reach the legal assistant service.',
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
