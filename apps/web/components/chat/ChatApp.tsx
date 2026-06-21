"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, Scale, X } from "lucide-react";
import {
  type ChatResponse,
  type ChatSettings,
  type Turn,
  DEFAULT_SETTINGS,
} from "@/lib/types";
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

      setTurns((t) => [...t, { id: uid(), role: "user", content: question }]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            top_k: settings.topK,
            provider: settings.provider,
            model: settings.model || undefined,
            temperature: settings.temperature,
            max_tokens: settings.maxTokens ?? undefined,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          setTurns((t) => [
            ...t,
            { id: uid(), role: "assistant", content: data.error ?? "Something went wrong.", error: true },
          ]);
        } else {
          const payload = data as ChatResponse;
          setTurns((t) => [
            ...t,
            {
              id: uid(),
              role: "assistant",
              content: payload.answer || "No answer was returned.",
              sources: payload.sources ?? [],
            },
          ]);
        }
      } catch {
        setTurns((t) => [
          ...t,
          { id: uid(), role: "assistant", content: "Network error — please try again.", error: true },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, settings],
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
        className="hidden w-72 shrink-0 border-r border-border bg-surface lg:block"
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
            className="absolute left-0 top-0 h-full w-72 border-r border-border bg-surface shadow-xl"
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
              Grounded in indexed acts and may be incomplete. Verify against the cited sources.
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
      <h2 className="mt-5 text-xl font-semibold tracking-tight">Ask about the law</h2>
      <p className="mt-1.5 max-w-md text-sm text-muted">
        Questions on Bangladesh statutory law, answered from the indexed acts with citations you can check.
      </p>
      <div className="mt-6 flex w-full max-w-md flex-col gap-2">
        {EXAMPLES.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="rounded-xl border border-border bg-surface px-4 py-3 text-left text-sm text-foreground transition-colors hover:border-accent/40 hover:bg-accent-soft/40"
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
