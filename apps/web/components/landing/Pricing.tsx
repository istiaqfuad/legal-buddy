"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

export interface Tier {
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  cta: string;
  featured?: boolean;
  badge?: string;
  features: string[];
}

export const TIERS: Tier[] = [
  {
    name: "Free",
    tagline: "For the curious — feel the magic.",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
    features: [
      "5 cited answers / day",
      "Top-6 statute retrieval",
      "Section-level citations",
      "Conversation history",
      "Bangla + English queries",
    ],
  },
  {
    name: "Professional",
    tagline: "For students, advocates & researchers.",
    monthly: 499,
    yearly: 399,
    cta: "Go Professional",
    featured: true,
    badge: "Most popular",
    features: [
      "Unlimited cited answers",
      "Top-12 deep retrieval",
      "Priority models (GPT-OSS 120B + Gemini)",
      "Follow-up memory (12 turns)",
      "Export answers + sources",
      "Early access to new acts",
      "Priority support",
    ],
  },
  {
    name: "Chamber",
    tagline: "For firms, chambers & legal teams.",
    monthly: 2499,
    yearly: 1999,
    cta: "Talk to us",
    features: [
      "Everything in Professional",
      "5 seats included, add more anytime",
      "Shared chamber workspace",
      "API access + SSO",
      "Custom act ingestion",
      "Onboarding & SLA",
    ],
  },
];

export function Pricing({ compact = false }: { compact?: boolean }) {
  const [yearly, setYearly] = useState(true);

  return (
    <section id="pricing" className="scroll-mt-24 bg-bg py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Pricing"
          title={<>Start free. <em className="font-display italic text-accent">Upgrade</em> when it pays for itself.</>}
          copy="One cited answer can save hours of library work. Payments via Stripe are coming soon — lock in founding-member pricing today."
        >
          <Reveal delay={2}>
            <div className="mt-7 inline-flex items-center rounded-full border border-line bg-surface p-1.5 shadow-sm">
              {[
                { label: "Monthly", value: false },
                { label: "Yearly · save 20%", value: true },
              ].map((o) => (
                <button
                  key={o.label}
                  onClick={() => setYearly(o.value)}
                  className={cn(
                    "rounded-full px-5 py-2.5 text-sm font-semibold transition-all",
                    yearly === o.value ? "bg-accent text-white shadow-md" : "text-muted hover:text-text"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Reveal>
        </SectionHeading>

        <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
          {TIERS.map((t, i) => (
            <Reveal key={t.name} delay={i as 0 | 1 | 2} className="h-full">
              <article
                className={cn(
                  "lift relative flex h-full flex-col rounded-[26px] border p-8",
                  t.featured
                    ? "ink-canvas card-ring border-transparent text-white shadow-[0_30px_80px_-30px_rgba(6,13,11,0.7)]"
                    : "border-line bg-surface"
                )}
              >
                {t.badge && (
                  <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1a1405] shadow-lg">
                    <Sparkles className="h-3 w-3" /> {t.badge}
                  </span>
                )}
                <h3 className={cn("font-display text-2xl font-semibold tracking-tight", t.featured ? "text-white" : "text-text")}>
                  {t.name}
                </h3>
                <p className={cn("mt-1 text-[14.5px]", t.featured ? "text-white/60" : "text-muted")}>{t.tagline}</p>
                <div className="mt-6 flex items-end gap-2">
                  <span className={cn("font-display text-5xl font-semibold tracking-tight", t.featured ? "text-white" : "text-text")}>
                    ৳{yearly ? t.yearly : t.monthly}
                  </span>
                  <span className={cn("pb-1.5 text-sm", t.featured ? "text-white/50" : "text-faint")}>
                    / mo{yearly && t.monthly > 0 ? ", billed yearly" : ""}
                  </span>
                </div>
                <ul className="mt-7 flex-1 space-y-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14.5px]">
                      <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", t.featured ? "bg-amber-300/20 text-amber-200" : "bg-accent-soft text-accent-strong")}>
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className={t.featured ? "text-white/80" : "text-text"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={t.name === "Chamber" ? "mailto:hello@lawbuddy.example?subject=Chamber%20plan" : "/chat"}
                  className={cn(
                    "group mt-8 inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-[15px] font-bold transition-all",
                    t.featured
                      ? "btn-primary-gold btn-shine"
                      : "border border-line bg-bg text-text hover:border-accent/40 hover:bg-accent-soft"
                  )}
                >
                  {t.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>

        {!compact && (
          <Reveal delay={2}>
            <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-faint">
              Founding-member prices locked for life. Stripe checkout is being wired up —
              no card required today. General information only; Law Buddy is not a law firm
              and not a substitute for counsel.
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
