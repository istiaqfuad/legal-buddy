import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, BookOpenText, FileCheck2, LockKeyhole, Sparkles } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

type Mode = 'sign-in' | 'sign-up';

const COPY: Record<
  Mode,
  {
    eyebrow: string;
    title: ReactNode;
    body: string;
    points: { icon: typeof FileCheck2; text: string }[];
    footnote: string;
  }
> = {
  'sign-in': {
    eyebrow: 'Welcome back',
    title: (
      <>
        Keep your research
        <br />
        <span className="text-gradient-gold">in one place.</span>
      </>
    ),
    body: 'Sign in to return to your conversations, reopen the sources you saved and continue with your document library.',
    points: [
      { icon: FileCheck2, text: 'Every answer links to the act and section' },
      { icon: BookOpenText, text: 'Ask in Bangla, English or a mix' },
      { icon: LockKeyhole, text: 'Your chats and files stay private to your account' },
    ],
    footnote: 'LegalBuddy gives general legal information, not legal advice.',
  },
  'sign-up': {
    eyebrow: 'Free to start',
    title: (
      <>
        A clearer way to
        <br />
        <span className="text-gradient-gold">check the law.</span>
      </>
    ),
    body: 'Ask a question, read the explanation, then open the section it came from. LegalBuddy is free to try and takes a minute to set up.',
    points: [
      { icon: Sparkles, text: '5 sourced answers every day, free' },
      { icon: BookOpenText, text: 'Bangla and English questions welcome' },
      { icon: LockKeyhole, text: 'Private chat history and document storage' },
    ],
    footnote: 'No credit card required. General information only, not legal advice.',
  },
};

export function AuthShell({
  mode,
  children,
}: {
  mode: Mode;
  children: ReactNode;
}) {
  const copy = COPY[mode];

  return (
    <div className="ink-canvas relative min-h-dvh overflow-hidden">
      <div className="grid-overlay absolute inset-0" />
      <div className="noise-overlay absolute inset-0" />
      <div className="orb orb-a left-[-140px] top-[12%] h-[420px] w-[420px] bg-emerald-500/22" />
      <div className="orb orb-b right-[-120px] top-[-60px] h-[420px] w-[420px] bg-amber-400/14" />

      <div className="relative mx-auto grid min-h-dvh max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        {/* Brand story */}
        <div className="hidden flex-col justify-between px-10 py-10 lg:flex xl:px-16">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-3 rounded-full py-1 pr-4 transition-opacity hover:opacity-90"
          >
            <Logo className="h-10 w-10" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-xl font-semibold tracking-tight text-white">
                LegalBuddy
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-200/70">
                Bangladesh law, explained
              </span>
            </span>
          </Link>

          <div className="max-w-lg">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-200/75">
              {copy.eyebrow}
            </p>
            <h1 className="font-display mt-4 text-balance text-5xl font-semibold leading-[1.06] tracking-tight text-white xl:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-5 max-w-md text-pretty text-[17px] leading-relaxed text-white/60">
              {copy.body}
            </p>

            <ul className="mt-8 space-y-3">
              {copy.points.map((point) => (
                <li key={point.text} className="flex items-center gap-3 text-[15px] text-white/75">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/[0.06]">
                    <point.icon className="h-4 w-4 text-amber-200" />
                  </span>
                  {point.text}
                </li>
              ))}
            </ul>
          </div>

          <p className="max-w-sm text-[13px] leading-relaxed text-white/35">{copy.footnote}</p>
        </div>

        {/* Form */}
        <div className="flex min-h-dvh flex-col justify-center px-4 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-[460px]">
            <div className="mb-5 flex items-center justify-between lg:hidden">
              <Link href="/" className="flex items-center gap-2.5">
                <Logo className="h-9 w-9" />
                <span className="font-display text-lg font-semibold text-white">LegalBuddy</span>
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-white/65 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Home
              </Link>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-[#0a1512]/80 p-6 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-8">
              {children}
            </div>

            <p className="mt-5 text-center text-[12px] leading-relaxed text-white/35">
              General information only. Not legal advice or a lawyer-client relationship.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
