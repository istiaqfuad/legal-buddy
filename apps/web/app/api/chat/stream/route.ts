import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

const API_URL = process.env.API_URL ?? 'http://api:8000';
const CONNECT_TIMEOUT_MS = 120_000;

const TIER_LIMITS: Record<string, number> = {
  free: 5,
  starter: 30,
  professional: 999999,
  enterprise: 999999,
};

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
  const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@ep-dummy.aws.neon.tech/neondb');

  // 1. Auth check
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Please sign in to use Law Buddy.' }, { status: 401 });
  }
  const userId = session.user.id;

  // 2. Get or create user profile to determine tier
  await sql`
    INSERT INTO user_profiles (auth_user_id)
    VALUES (${userId})
    ON CONFLICT (auth_user_id) DO NOTHING
  `;
  const tierRows = await sql`SELECT subscription_tier FROM user_profiles WHERE auth_user_id = ${userId}`;
  const tier = (tierRows[0]?.subscription_tier as string) ?? 'free';

  // 3. Rate limit check (atomic increment)
  const today = new Date().toISOString().slice(0, 10);
  const limitRows = await sql`
    INSERT INTO query_limits (user_id, date, count)
    VALUES (${userId}, ${today}, 1)
    ON CONFLICT (user_id, date) DO UPDATE SET count = query_limits.count + 1
    RETURNING count
  `;
  const count = (limitRows[0]?.count as number) ?? 1;
  const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
  if (count > limit) {
    return NextResponse.json(
      { error: `Daily limit of ${limit} queries reached. Upgrade your plan for more.` },
      { status: 429 }
    );
  }

  // 4. Parse request body
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

  const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? v : undefined;
  const history = parseHistory(body.history);
  // sessionId is passed from the client to associate messages with a DB session
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : null;

  const provider =
    body.provider === 'gemini' || body.provider === 'groq' || body.provider === 'openai'
      ? body.provider
      : undefined;
  const model =
    typeof body.model === 'string' && body.model.trim() ? body.model.trim() : undefined;

  // 5. Forward to FastAPI with abort timeout
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

    // 6. Tee the stream: one copy for the client, one to capture for DB persistence
    let fullAnswer = '';
    let sources: unknown[] = [];

    const [streamForClient, streamForCapture] = upstream.body.tee();

    // Non-blocking: parse the capture stream and save to DB when complete
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
                if (event === 'sources') sources = data.sources ?? [];
                else if (event === 'delta') fullAnswer += data.text ?? '';
              } catch { /* ignore malformed events */ }
            }
          }
        }
        // Save both turns to DB if we have a session ID and a full answer
        if (sessionId && fullAnswer) {
          await sql`
            INSERT INTO chat_messages (session_id, role, content)
            VALUES (${sessionId}, 'user', ${question})
          `;
          await sql`
            INSERT INTO chat_messages (session_id, role, content, sources)
            VALUES (${sessionId}, 'assistant', ${fullAnswer}, ${JSON.stringify(sources)})
          `;
          await sql`UPDATE chat_sessions SET updated_at = NOW() WHERE id = ${sessionId}`;
        }
      } catch { /* non-critical: DB save failure shouldn't affect the stream */ }
    })();

    // Stream the client copy immediately
    return new Response(streamForClient, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-User-Tier': tier,
        'X-Queries-Used': String(count),
        'X-Queries-Limit': String(limit),
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
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
