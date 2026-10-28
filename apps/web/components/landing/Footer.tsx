import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const COLS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Sample answer", href: "#demo" },
      { label: "Pricing", href: "#pricing" },
      { label: "Start a conversation", href: "/chat" },
      { label: "My documents", href: "/documents" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/auth/sign-in" },
      { label: "Create account", href: "/auth/sign-up" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Not legal advice", href: "#faq" },
      { label: "How answers are built", href: "#how-it-works" },
      { label: "Contact", href: "mailto:hello@legalbuddy.app" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#060d0b] text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Logo className="h-9 w-9" />
              <span className="flex flex-col leading-none">
                <span className="font-display text-[19px] font-semibold tracking-tight">LegalBuddy</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-amber-200/70">
                  Bangladesh law, explained
                </span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
              A research assistant for Bangladeshi law. Clear explanations with
              the act and section behind every point.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLS.map((c) => (
              <div key={c.title}>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">{c.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {c.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-sm text-white/65 transition-colors hover:text-amber-200">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-[13px] leading-relaxed text-white/60">
          <span className="font-semibold text-white/80">Disclaimer: </span>
          LegalBuddy provides general legal information for education and
          research. It is not legal advice, creates no lawyer-client relationship
          and must be checked against official sources. Always consult a licensed
          advocate for your matter.
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-[13px] text-white/60 sm:flex-row">
          <p>© 2026 LegalBuddy. All rights reserved.</p>
          <p>Built for Bangladesh&rsquo;s legal community.</p>
        </div>
      </div>
    </footer>
  );
}
