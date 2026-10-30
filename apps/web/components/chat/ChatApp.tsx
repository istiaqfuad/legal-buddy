"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  FileText,
  Gavel,
  Landmark,
  PanelLeft,
  Settings2,
  X,
} from "lucide-react";
import {
  type ChatSettings,
  type Source,
  type Turn,
  DEFAULT_SETTINGS,
} from "@/lib/types";

const HISTORY_WINDOW_TURNS = 6;
import { Message } from "./Message";
import { Composer, type ChatAttachment } from "./Composer";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(initialSessionId ?? null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [queryUsage, setQueryUsage] = useState<{ remaining: number; limit: number } | null>(null);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  // Creating a session inside send() changes currentSessionId; loading it then
  // would wipe the optimistic user turn and the answer that is still streaming.
  const skipSessionLoadRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading]);

  useEffect(() => {
    if (!currentSessionId) return;
    if (skipSessionLoadRef.current) {
      skipSessionLoadRef.current = false;
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`/api/chat/sessions/${currentSessionId}`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load conversation");
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        setTurns(data.session?.messages ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setTurns([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentSessionId]);

  // Close the settings panel on Escape.
  useEffect(() => {
    if (!drawerOpen && !mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setDrawerOpen(false);
      setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, mobileNavOpen]);

  const startNewSession = useCallback(() => {
    setCurrentSessionId(null);
    setTurns([]);
    setLoading(false);
    setMobileNavOpen(false);
  }, []);

  const uploadDocuments = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    setUploadError("");
    setUploading(true);

    for (const file of list.slice(0, 5)) {
      const form = new FormData();
      form.append("file", file);

      try {
        const response = await fetch("/api/documents", { method: "POST", body: form });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          setUploadError(payload?.error ?? `Could not upload ${file.name}.`);
          continue;
        }
        setAttachments((current) => [
          ...current,
          { id: payload.document.id as string, name: payload.document.name as string },
        ]);
      } catch {
        setUploadError(`Could not upload ${file.name}. Check your connection and try again.`);
      }
    }

    setUploading(false);
  }, []);

  const send = useCallback(
    async (raw?: string) => {
      const question = (raw ?? input).trim();
      if (!question || loading || uploading) return;

      // Conversation memory: send prior turns (hard last-N-turn window) so the
      // backend can resolve follow-ups. Built before appending the new user turn.
      const history = turns
        .filter((t) => !t.error)
        .map((t) => ({ role: t.role, content: t.content }))
        .slice(-HISTORY_WINDOW_TURNS);

      setTurns((t) => [...t, { id: uid(), role: "user", content: question }]);
      setInput("");
      setAttachments([]);
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
            skipSessionLoadRef.current = Boolean(activeSessionId);
            setCurrentSessionId(activeSessionId);
          }
        } catch {
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
    [input, loading, uploading, settings, turns, currentSessionId],
  );

  const isEmpty = turns.length === 0;

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      {/* Session sidebar — desktop */}
      <div
        className={cn(
          "hidden shrink-0 overflow-hidden border-r border-line transition-[width] duration-200 md:block",
          sidebarOpen ? "w-64" : "w-0",
        )}
      >
        <div className="h-full w-64">
          <SessionSidebar
            currentSessionId={currentSessionId}
            onSelectSession={setCurrentSessionId}
            onNewSession={startNewSession}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 border-b border-line">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="rounded-md p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text md:hidden"
                aria-label="Open conversations"
              >
                <PanelLeft className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden rounded-md p-2 text-muted transition-colors hover:bg-surface-2 hover:text-text md:block"
                aria-label="Toggle sidebar"
              >
                <PanelLeft className="h-4.5 w-4.5" />
              </button>
              <Logo className="h-6 w-6 md:hidden" />
              <span className="hidden items-center gap-2 text-xs text-muted sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Bangladesh law · cited sources
              </span>
            </div>

            <div className="flex items-center gap-1">
              {queryUsage ? (
                <span
                  className={cn(
                    "mr-1 hidden text-xs tabular-nums sm:inline",
                    queryUsage.remaining <= 1 ? "text-danger" : "text-muted",
                  )}
                >
                  {queryUsage.remaining} of {queryUsage.limit} answers left
                </span>
              ) : (
                <Link
                  href="/pricing"
                  className="mr-1 hidden text-xs font-medium text-muted transition-colors hover:text-text sm:inline"
                >
                  Free plan · Upgrade
                </Link>
              )}
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Settings"
                aria-expanded={drawerOpen}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <Link
                href="/documents"
                className="hidden items-center gap-1.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-text sm:flex"
              >
                <FileText className="h-4 w-4" />
                Documents
              </Link>
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
              <div className="space-y-8 py-8">
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
        <div className="shrink-0 border-t border-line bg-bg">
          <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
            <Composer
              value={input}
              onChange={setInput}
              onSend={() => send()}
              loading={loading}
              attachments={attachments}
              uploading={uploading}
              uploadError={uploadError}
              onUpload={uploadDocuments}
              onRemoveAttachment={(id) =>
                setAttachments((current) => current.filter((item) => item.id !== id))
              }
            />
            <p className="mt-2 text-center text-[11px] text-faint">
              General information, not legal advice. Verify every citation.
            </p>
          </div>
        </div>
      </div>

      {/* Session sidebar — mobile */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fade-in absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden
          />
          <aside className="panel-in absolute left-0 top-0 h-full w-[18rem] max-w-[86vw] border-r border-line bg-bg">
            <button
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close conversations"
              className="absolute right-2 top-3 z-10 rounded-md p-2 text-muted hover:bg-surface-2 hover:text-text"
            >
              <X className="h-4 w-4" />
            </button>
            <SessionSidebar
              currentSessionId={currentSessionId}
              onSelectSession={(id) => {
                setCurrentSessionId(id);
                setMobileNavOpen(false);
              }}
              onNewSession={startNewSession}
            />
          </aside>
        </div>
      )}

      {/* Settings — right slide-over */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="fade-in absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside
            aria-label="Settings"
            className="panel-in absolute right-0 top-0 h-full w-[24rem] max-w-[92vw] overflow-hidden border-l border-line bg-surface"
          >
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close settings"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-text"
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
    <div className="mx-auto flex min-h-full max-w-xl flex-col justify-center py-16">
      <div className="rise">
        <Logo className="h-9 w-9" />
        <h1 className="font-display mt-4 text-balance text-3xl font-semibold leading-tight tracking-tight text-text sm:text-4xl">
          What does the law <em className="italic text-accent">say?</em>
        </h1>
        <p className="mt-2.5 max-w-md text-[15px] leading-relaxed text-muted">
          Describe the situation in Bangla or English. You&rsquo;ll get a plain
          explanation and the act and section behind it.
        </p>

        <div className="mt-8">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">
            Try asking
          </p>
          <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.q}
                onClick={() => onPick(ex.q)}
                className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2"
              >
                <ex.icon className="h-4 w-4 shrink-0 text-faint transition-colors group-hover:text-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-medium text-faint">{ex.tag}</span>
                  <span className="block text-[14px] text-text">{ex.q}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
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
    <div className="flex items-center gap-2.5 py-1" role="status" aria-label="Thinking">
      <span className="text-sm text-muted">Looking through the statutes</span>
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1 w-1 rounded-full bg-faint"
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
