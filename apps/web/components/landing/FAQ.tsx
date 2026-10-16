"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Is Law Buddy a lawyer? Can I rely on it in court?",
    a: "No — Law Buddy provides general legal information, not legal advice, and is not a law firm. Always verify the cited section in the official gazette or bare act and consult a licensed advocate before acting. Every answer says this, and every claim carries a citation so verification is fast.",
  },
  {
    q: "Where do the answers come from?",
    a: "A RAG pipeline: your question is embedded locally, matched against a Qdrant index of Bangladeshi statute sections, and answered only from the top retrieved passages. If nothing matches confidently, the app asks a clarifying question instead of inventing an answer.",
  },
  {
    q: "Which laws are covered?",
    a: "The Penal Code 1860, CrPC 1898, Evidence Act 1872, the Constitution, Contract Act, Nari-O-Shishu Nirjatan Daman Ain, Labour Act 2006 and 30+ more acts and ordinances — over 2,400 indexed sections and growing.",
  },
  {
    q: "Can I ask in Bangla?",
    a: "Yes. Ask in Bangla, English, or Banglish. Retrieval is multilingual, and answers follow the language of your question unless you ask otherwise.",
  },
  {
    q: "What does the free plan include?",
    a: "5 cited answers per day with top-6 retrieval, full citation panel, and conversation history. No credit card required — sign in and ask.",
  },
  {
    q: "When will paid plans and Stripe launch?",
    a: "Paid tiers (Professional ৳499/mo, Chamber ৳2,499/mo) are priced and ready; Stripe checkout is being integrated now. Join free today and you'll be offered founding-member pricing locked for life when billing opens.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-24 bg-bg py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="FAQ"
          title={<>Questions, <em className="font-display italic text-accent">answered</em>.</>}
        />
        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} delay={0}>
                <div
                  data-open={isOpen}
                  className={cn(
                    "faq-item overflow-hidden rounded-2xl border transition-colors",
                    isOpen ? "border-accent/30 bg-surface shadow-md" : "border-line bg-surface hover:border-accent/25"
                  )}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-[16px] font-semibold tracking-tight text-text">{f.q}</span>
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300", isOpen ? "rotate-45 bg-accent text-white" : "bg-accent-soft text-accent-strong")}>
                      <Plus className="h-4 w-4" />
                    </span>
                  </button>
                  <div className="faq-answer">
                    <div className="faq-inner">
                      <p className="px-6 pb-6 text-[15px] leading-relaxed text-muted">{f.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
