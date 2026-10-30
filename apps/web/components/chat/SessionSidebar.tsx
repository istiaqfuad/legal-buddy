'use client';

import { useEffect, useState } from 'react';
import { Loader2, MessageSquare, Plus } from 'lucide-react';
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
    <div className="flex h-full flex-col bg-bg text-text">
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 pb-4 pt-4">
        <Logo className="h-7 w-7" />
        <span className="font-display text-[16px] font-semibold tracking-tight">LegalBuddy</span>
      </div>

      <div className="px-3">
        <button
          onClick={onNewSession}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-text px-3 py-2 text-[13px] font-medium text-bg transition-opacity hover:opacity-85"
        >
          <Plus className="h-4 w-4" />
          New conversation
        </button>
      </div>

      <p className="px-5 pb-1.5 pt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
        Recent
      </p>
      <div className="slim-scroll flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-faint" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="mx-2 rounded-lg border border-dashed border-line px-3 py-6 text-center">
            <MessageSquare className="mx-auto h-4 w-4 text-faint" />
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              No conversations yet.
              <br />Ask your first question.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {sessions.map((s) => {
              const active = currentSessionId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  className={cn(
                    'group flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left transition-colors',
                    active
                      ? 'bg-surface-2 text-text'
                      : 'text-muted hover:bg-surface-2/60 hover:text-text',
                  )}
                >
                  <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">{s.title}</span>
                    <span className="mt-0.5 block text-[10px] text-faint">
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
    </div>
  );
}
