'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, MessageSquare, Loader2, Sparkles, ArrowUpRight } from 'lucide-react';
import type { ChatSession } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';

export function SessionSidebar({
  currentSessionId,
  onSelectSession,
  onNewSession,
}: {
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
}) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/chat/sessions')
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.sessions ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentSessionId]);

  return (
    <div className="flex h-full flex-col bg-[#0a1512] text-white">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-5">
        <Logo className="h-8 w-8" />
        <span className="flex flex-col leading-none">
          <span className="font-display text-[17px] font-semibold tracking-tight">Law Buddy</span>
          <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.24em] text-amber-200/70">
            Bangladesh Law AI
          </span>
        </span>
      </div>

      <div className="px-3">
        <button
          onClick={onNewSession}
          className="btn-shine flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#e9cd8d] via-[#c9a45c] to-[#a8813c] px-3 py-3 text-sm font-bold text-[#1a1405] shadow-[0_10px_28px_-10px_rgba(201,164,92,0.6)] transition-all hover:-translate-y-px hover:brightness-105"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          New conversation
        </button>
      </div>

      <p className="px-5 pb-1.5 pt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
        Recent
      </p>
      <div className="slim-scroll flex-1 overflow-y-auto px-2.5 pb-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-white/40" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="mx-2 rounded-2xl border border-dashed border-white/12 px-4 py-6 text-center">
            <MessageSquare className="mx-auto h-5 w-5 text-white/25" />
            <p className="mt-2 text-xs leading-relaxed text-white/40">
              No conversations yet.
              <br />Ask your first question.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((s) => {
              const active = currentSessionId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  className={cn(
                    'group relative flex w-full items-start gap-2.5 overflow-hidden rounded-xl px-3 py-2.5 text-left text-sm transition-all',
                    active
                      ? 'bg-white/10 text-white shadow-inner'
                      : 'text-white/55 hover:bg-white/6 hover:text-white'
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-2/3 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-amber-200 to-amber-500" />
                  )}
                  <MessageSquare className={cn("mt-0.5 h-4 w-4 shrink-0", active ? "text-amber-200" : "text-white/30 group-hover:text-white/60")} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium">{s.title}</span>
                    <span className="mt-0.5 block text-[11px] text-white/35">
                      {new Date(s.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      {typeof s.message_count === 'number' ? ` · ${s.message_count} msgs` : ''}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Upgrade card */}
      <div className="p-3">
        <Link
          href="/pricing"
          className="group block overflow-hidden rounded-2xl border border-amber-200/20 bg-gradient-to-br from-amber-300/15 via-white/5 to-emerald-300/10 p-4 transition-all hover:border-amber-200/40"
        >
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-amber-200">
            <Sparkles className="h-3.5 w-3.5" /> Go Professional
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-white/55">
            Unlimited answers, deep retrieval, priority models.
          </p>
          <span className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-bold text-white group-hover:text-amber-200">
            View plans <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
