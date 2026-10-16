"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Settings2, X, PanelLeft, Sparkles, Gavel, BookOpenText, Landmark } from "lucide-react";
import {
  type ChatSettings,
  type Source,
  type Turn,
  DEFAULT_SETTINGS,
} from "@/lib/types";

const HISTORY_WINDOW_TURNS = 6;
import { Message } from "./Message";
import { Composer } from "./Composer";
import { SidebarContent } from "./Sidebar";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  { tag: "Penal Code", icon: Gavel, q: "What is the punishment for theft under the Penal Code?" },
  { tag: "Homicide", icon: BookOpenText, q: "How is culpable homicide defined?" },
  { tag: "Writ", icon: Landmark, q: "What are the grounds for a writ petition?" },
];

import { SessionSidebar } from "./SessionSidebar";
import { UserMenu } from "../auth/UserMenu";

export function ChatApp({ sessionId: initialSessionId }: { sessionId?: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(initialSessionId ?? null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [queryUsage, setQueryUsage] = useState<{ remaining: number; limit: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading]);

  useEffect(() => {
    if (currentSessionId) {
      setLoading(true);
      fetch(`/api/chat/sessions/${currentSessionId}`)
        .then(r => r.json())
        .then(data => {
          if (data.session) {
            setTurns(data.session.messages ?? []);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setTurns([]);
    }
  }, [currentSessionId]);

  // Close the settings panel on Escape.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const send = useCallback(
    async (raw?: string) => {
      const question = (raw ?? input).trim();
      if (!question || loading) return;

      // Conversation memory: send prior turns (hard last-N-turn window) so the
      // backend can resolve follow-ups. Built before appending the new user turn.
      const history = turns
        .filter((t) => !t.error)
        .map((t) => ({ role: t.role, content: t.content }))
        .slice(-HISTORY_WINDOW_TURNS);

      setTurns((t) => [...t, { id: uid(), role: "user", content: question }]);
      setInput("");
      setLoading(true);

      let activeSessionId = currentSessionId;
      if (!activeSessionId) {
        try {
          const res = await fetch('/api/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: question.slice(0, 80) }),
          });
          if (res.ok) {
            const data = await res.json();
            activeSessionId = data.session?.id ?? null;
            setCurrentSessionId(activeSessionId);
          }
        } catch (e) {
          console.error("Failed to create session");
        }
      }

      // The assistant turn is created lazily on the first event so the "Thinking"
      // indicator shows until tokens start arriving.
      const assistantId = uid();
      let assistantAdded = false;
      const ensureAssistant = () => {
        if (assistantAdded) return;
        assistantAdded = true;
        setTurns((t) => [
          ...t,
          { id: assistantId, role: "assistant", content: "", sources: [] },
        ]);
      };
      const patch = (fn: (turn: Turn) => Turn) =>
        setTurns((t) => t.map((x) => (x.id === assistantId ? fn(x) : x)));

      const handleEvent = (event: string, data: string) => {
        let payload: { text?: string; sources?: Source[]; error?: string };
        try {
          payload = JSON.parse(data);
        } catch {
          return;
        }
        if (event === "sources") {
          ensureAssistant();
          patch((x) => ({ ...x, sources: payload.sources ?? [] }));
        } else if (event === "delta") {
          ensureAssistant();
          setLoading(false);
          patch((x) => ({ ...x, content: x.content + (payload.text ?? "") }));
        } else if (event === "error") {
          ensureAssistant();
          patch((x) => ({
            ...x,
            content: payload.error ?? "Something went wrong.",
            error: true,
          }));
        }
      };

      try {
        const res = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            history,
            session_id: activeSessionId,
            top_k: settings.topK,
            provider: settings.provider,
            model: settings.model || undefined,
            temperature: settings.temperature,
            max_tokens: settings.maxTokens ?? undefined,
            clarify_score_floor: settings.clarifyScoreFloor,
            low_confidence_floor: settings.lowConfidenceFloor,
          }),
        });

        if (res.headers.has('x-queries-used') && res.headers.has('x-queries-limit')) {
          const used = parseInt(res.headers.get('x-queries-used') || '0', 10);
          const limit = parseInt(res.headers.get('x-queries-limit') || '0', 10);
          if (!isNaN(used) && !isNaN(limit) && limit > 0) {
            setQueryUsage({ remaining: Math.max(0, limit - used), limit });
          }
        }

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null);
          ensureAssistant();
          patch((x) => ({
            ...x,
            content: data?.error ?? "Something went wrong.",
            error: true,
          }));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let sep: number;
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            const frame = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            let event = "message";
            const dataLines: string[] = [];
            for (const line of frame.split("\n")) {
              if (line.startsWith("event:")) event = line.slice(6).trim();
              else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
            }
            if (dataLines.length) handleEvent(event, dataLines.join("\n"));
          }
        }
      } catch {
        ensureAssistant();
        patch((x) => ({
          ...x,
          content: x.content || "Network error — please try again.",
          error: true,
        }));
      } finally {
        setLoading(false);
      }
    },
    [input, loading, settings, turns, currentSessionId],
  );

  const isEmpty = turns.length === 0;

  return (
    <div className="relative flex h-dvh overflow-hidden bg-bg">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(600px_200px_at_50%_-60px,rgba(20,113,83,0.14),transparent)]" />

      {/* Session Sidebar */}
      <div className={cn("hidden shrink-0 overflow-hidden transition-all duration-300 md:block", sidebarOpen ? "w-72" : "w-0")}>
        <div className="h-full w-72 border-r border-white/10">
          <SessionSidebar
            currentSessionId={currentSessionId}
            onSelectSession={setCurrentSessionId}
            onNewSession={() => setCurrentSessionId(null)}
          />
        </div>
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 border-b border-line bg-bg/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden rounded-lg p-2 text-muted transition-colors hover:bg-accent-soft hover:text-accent-strong md:block"
                aria-label="Toggle sidebar"
              >
                <PanelLeft className="h-5 w-5" />
              </button>
              <Logo className="h-7 w-7 md:hidden" />
              <span className="hidden items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12px] font-semibold text-muted shadow-sm sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {settings.provider} · {settings.model || "default"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {queryUsage ? (
                <span className={cn(
                  "hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold sm:inline-flex",
                  queryUsage.remaining <= 1 ? "border-danger/30 bg-danger/5 text-danger" : "border-line bg-surface text-muted"
                )}>
                  <Sparkles className="h-3 w-3" />
                  {queryUsage.remaining}/{queryUsage.limit} left today
                </span>
              ) : (
                <a href="/pricing" className="hidden items-center gap-1 rounded-full bg-gold-soft px-3 py-1.5 text-xs font-bold text-[#8a6d2b] transition-colors hover:bg-gold/20 sm:inline-flex">
                  <Sparkles className="h-3 w-3" /> Free · Upgrade
                </a>
              )}
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Settings"
                aria-expanded={drawerOpen}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-muted transition-colors hover:bg-accent-soft hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Tune</span>
              </button>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Messages */}
        <main className="slim-scroll flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            {isEmpty ? (
              <EmptyState onPick={(q) => send(q)} />
            ) : (
              <div className="space-y-6 py-6">
                {turns.map((turn) => (
                  <Message key={turn.id} turn={turn} />
                ))}
                {loading && <Thinking />}
                <div ref={bottomRef} />
              </div>
            )}
            {!isEmpty && <div ref={bottomRef} className="h-2" />}
          </div>
        </main>

        {/* Composer */}
        <div className="shrink-0 border-t border-line/60 bg-bg/80 backdrop-blur-xl">
          <div className="mx-auto max-w-3xl px-4 py-3.5 sm:px-6">
            <Composer value={input} onChange={setInput} onSend={() => send()} loading={loading} />
            <p className="mt-2 text-center text-xs text-faint">
              General information, not legal advice —{" "}
              <a href="/pricing" className="font-semibold text-accent hover:underline">verify every citation</a>{" "}
              & consult a lawyer.
            </p>
          </div>
        </div>
      </div>

      {/* Settings — right slide-over */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="fade-in absolute inset-0 bg-[#060d0b]/50 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside
            aria-label="Settings"
            className="panel-in absolute right-0 top-0 h-full w-[26rem] max-w-[92vw] overflow-hidden rounded-l-3xl border-l border-line bg-surface shadow-2xl"
          >
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close settings"
              className="absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-xl text-muted transition-colors hover:bg-accent-soft hover:text-accent-strong"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent
              settings={settings}
              onChange={setSettings}
              onClear={() => {
                setTurns([]);
                setDrawerOpen(false);
              }}
              canClear={!isEmpty}
            />
          </aside>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col justify-center py-14">
      <div className="rise text-center">
        <div className="relative mx-auto h-16 w-16">
          <div className="absolute -inset-3 rounded-[28px] bg-gradient-to-br from-emerald-400/30 to-amber-300/30 blur-xl" />
          <Logo className="relative h-16 w-16 drop-shadow-xl" />
        </div>
        <h1 className="font-display mt-6 text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-text sm:text-[2.75rem]">
          What does the law <em className="italic text-accent">say?</em>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-pretty text-[15.5px] leading-relaxed text-muted">
          Ask about Bangladesh statutes & precedent. Every answer arrives
          grounded in the acts — with sources you can check in one tap.
        </p>

        <div className="mt-8 text-left">
          <p className="mb-2.5 px-1 text-[11px] font-bold uppercase tracking-[0.2em] text-faint">
            Try asking
          </p>
          <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_18px_50px_-24px_rgba(6,13,11,0.35)]">
            {EXAMPLES.map((ex, i) => (
              <button
                key={ex.q}
                onClick={() => onPick(ex.q)}
                className={cn(
                  "group flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-accent-soft/60",
                  i > 0 && "border-t border-line",
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-soft to-gold-soft text-accent-strong ring-1 ring-accent/15 transition-transform group-hover:scale-105">
                  <ex.icon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
                    {ex.tag}
                  </span>
                  <span className="block truncate text-[14.5px] font-medium text-text sm:whitespace-normal">{ex.q}</span>
                </span>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 -translate-x-1 text-faint opacity-0 transition-all group-hover:translate-x-0 group-hover:text-accent group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div className="rise flex items-center gap-3 py-1" role="status" aria-label="Thinking">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-soft">
        <Logo className="h-5 w-5" />
      </span>
      <span className="text-sm font-medium text-muted">Searching 2,400+ sections…</span>
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-accent"
            style={{ animation: "pulse-dot 1.2s ease-in-out infinite", animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
    </div>
  );
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}
