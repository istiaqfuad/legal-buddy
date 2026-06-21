"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Scale } from "lucide-react";
import {
  type ChatResponse,
  type ChatSettings,
  type Turn,
  DEFAULT_SETTINGS,
} from "@/lib/types";
import { Header } from "./Header";
import { Message } from "./Message";
import { Composer } from "./Composer";
import { TestSettings } from "./TestSettings";

const EXAMPLES = [
  "What is the punishment for theft under the Penal Code?",
  "How is culpable homicide defined?",
  "What are the grounds for a writ petition?",
];

export function ChatApp() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading]);

  const send = useCallback(
    async (raw?: string) => {
      const question = (raw ?? input).trim();
      if (!question || loading) return;

      const userTurn: Turn = { id: uid(), role: "user", content: question };
      setTurns((t) => [...t, userTurn]);
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

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Header onClear={() => setTurns([])} canClear={!isEmpty} />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4">
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

        <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pb-4 pt-2">
          {showSettings && (
            <TestSettings settings={settings} onChange={setSettings} />
          )}
          <Composer
            value={input}
            onChange={setInput}
            onSend={() => send()}
            loading={loading}
            topK={settings.topK}
            onTopK={(topK) => setSettings((s) => ({ ...s, topK }))}
            onToggleSettings={() => setShowSettings((v) => !v)}
            settingsOpen={showSettings}
          />
          <p className="mt-2 text-center text-xs text-muted">
            Answers are grounded in indexed acts and may be incomplete. Verify against the cited sources.
          </p>
        </div>
      </main>
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
    <div className="flex items-center gap-1.5 text-muted" aria-label="Thinking">
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
