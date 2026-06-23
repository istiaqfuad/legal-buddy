"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, Scale, X } from "lucide-react";
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

const EXAMPLES = [
  "What is the punishment for theft under the Penal Code?",
  "How is culpable homicide defined?",
  "What are the grounds for a writ petition?",
];

export function ChatApp() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading]);

  // Close the mobile drawer on Escape.
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
            top_k: settings.topK,
            provider: settings.provider,
            model: settings.model || undefined,
            temperature: settings.temperature,
            max_tokens: settings.maxTokens ?? undefined,
            clarify_score_floor: settings.clarifyScoreFloor,
            low_confidence_floor: settings.lowConfidenceFloor,
          }),
        });

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
    [input, loading, settings, turns],
  );

  const isEmpty = turns.length === 0;
  const sidebar = (
    <SidebarContent
      settings={settings}
      onChange={setSettings}
      onClear={() => {
        setTurns([]);
        setDrawerOpen(false);
      }}
      canClear={!isEmpty}
    />
  );

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        aria-label="Settings"
        className="hidden w-80 shrink-0 border-r border-border bg-surface lg:block"
      >
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside
            aria-label="Settings"
            className="absolute left-0 top-0 h-full w-80 max-w-[85vw] border-r border-border bg-surface shadow-xl"
          >
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close settings"
              className="absolute right-3 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center gap-2 border-b border-border px-3 py-2.5 lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open settings"
            aria-expanded={drawerOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Scale className="h-4 w-4 text-accent" /> Law Buddy
          </span>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4">
            {isEmpty ? (
              <EmptyState onPick={(q) => send(q)} />
            ) : (
              <div className="flex-1 space-y-6 py-6">
                {turns.map((turn) => (
                  <Message key={turn.id} turn={turn} />
                ))}
                {loading && <Thinking />}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </main>

        {/* Composer */}
        <div className="shrink-0 border-t border-border bg-background px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <Composer value={input} onChange={setInput} onSend={() => send()} loading={loading} />
            <p className="mt-2 text-center text-xs text-muted">
              General legal information, not legal advice; consult a lawyer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        <Scale className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight">Ask about the law</h2>
      <p className="mt-2 max-w-md text-base text-muted">
        Questions on Bangladesh statutory law, answered from the indexed acts with citations you can check.
      </p>
      <div className="mt-6 flex w-full max-w-md flex-col gap-2">
        {EXAMPLES.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-left text-[15px] text-foreground transition-colors hover:border-accent/40 hover:bg-accent-soft/40"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-1.5 py-1 text-muted" aria-label="Thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-muted"
          style={{ animation: "pulse-dot 1.2s ease-in-out infinite", animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}
