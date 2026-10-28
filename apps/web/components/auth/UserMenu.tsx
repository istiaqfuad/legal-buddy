'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Crown, FileText, LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth/client';

export function UserMenu() {
  const { data: session, isPending } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (isPending) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-accent-soft" />;
  }

  if (!session) {
    return (
      <a
        href="/auth/sign-in"
        className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-px hover:brightness-110"
      >
        Sign in
      </a>
    );
  }

  const name = session.user.name || session.user.email || 'Account';
  const initial = name[0]?.toUpperCase() ?? 'A';

  async function signOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      window.location.href = '/';
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1 pr-1.5 shadow-sm transition-all hover:border-accent/40 hover:shadow"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt=""
            referrerPolicy="no-referrer"
            className="h-8 w-8 rounded-lg object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1d8a66] to-[#0b3d2c] text-[13px] font-bold text-white">
            {initial}
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-muted" />
      </button>

      {open && (
        <div className="rise absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-20px_rgba(6,13,11,0.4)]">
          <div className="border-b border-line bg-gradient-to-br from-accent-soft to-gold-soft px-4 py-3.5">
            <p className="truncate text-sm font-bold text-text">{name}</p>
            <p className="truncate text-xs text-muted">{session.user.email}</p>
          </div>
          <div className="p-1.5">
            <a
              href="/documents"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-accent-soft"
            >
              <FileText className="h-4 w-4 text-accent" />
              My documents
            </a>
            <a
              href="/pricing"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-gold-soft"
            >
              <Crown className="h-4 w-4 text-[#a8813c]" />
              View plans
            </a>
            <button
              onClick={signOut}
              disabled={signingOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-danger/5 hover:text-danger disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
