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
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-5">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="font-display hidden text-[16px] font-semibold tracking-tight text-text sm:block">
              LegalBuddy
            </span>
          </Link>

          <nav className="flex items-center gap-0.5">
            {links.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
                  active === link.key
                    ? 'bg-surface-2 text-text'
                    : 'text-muted hover:bg-surface-2/60 hover:text-text',
                )}
              >
                <link.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="hidden text-[12px] font-medium text-muted transition-colors hover:text-text sm:inline"
          >
            Free plan · Upgrade
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
