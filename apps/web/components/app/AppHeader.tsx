'use client';

import Link from 'next/link';
import { FileText, MessageSquareText } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { UserMenu } from '@/components/auth/UserMenu';
import { cn } from '@/lib/utils';

export function AppHeader({ active }: { active: 'chat' | 'documents' }) {
  const links = [
    { key: 'chat' as const, href: '/chat', label: 'Chat', icon: MessageSquareText },
    { key: 'documents' as const, href: '/documents', label: 'Documents', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a1512]/95 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-5">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Logo className="h-8 w-8" />
            <span className="font-display hidden text-[17px] font-semibold tracking-tight sm:block">
              LegalBuddy
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors',
                  active === link.key
                    ? 'bg-white/10 text-white'
                    : 'text-white/55 hover:bg-white/6 hover:text-white',
                )}
              >
                <link.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/pricing"
            className="hidden rounded-full border border-amber-200/25 bg-amber-300/10 px-3 py-1.5 text-[12px] font-bold text-amber-200 transition-colors hover:bg-amber-300/15 sm:inline-flex"
          >
            Free plan
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
