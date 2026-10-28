"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Is LegalBuddy legal advice?",
    a: "No. LegalBuddy gives general legal information for research and education. It is not a law firm, does not create a lawyer-client relationship and cannot replace advice from a licensed advocate. Check the cited section before you rely on anything you read here.",
  },
  {
    q: "Where do the answers come from?",
    a: "From Bangladeshi statutes. Your question is matched against an index of act sections, and the answer is written only from the closest matches. If the match is weak, LegalBuddy asks a follow-up question instead of inventing an answer.",
  },
  {
    q: "Which laws can I ask about?",
    a: "The Penal Code 1860, CrPC 1898, Evidence Act 1872, the Constitution, Contract Act 1872, Nari-O-Shishu Nirjatan Daman Ain, Labour Act 2006 and more than 30 other acts and ordinances. The index currently covers over 2,400 sections and is still growing.",
  },
  {
    q: "Can I ask in Bangla?",
    a: "Yes. Ask in Bangla, English or a mix of the two. The answer follows the language of your question unless you ask for something different.",
  },
  {
    q: "Do I need to know the section number?",
    a: "No. Describe the situation in your own words. LegalBuddy will find the relevant provisions and show you where they come from.",
  },
  {
    q: "What do I get on the free plan?",
    a: "Five sourced answers a day, the full citation panel, saved conversation history and the document library. No credit card is needed to start.",
  },
  {
    q: "Can I save my own documents?",
    a: "Yes. You can upload PDFs, Word documents, text files and images to a private library, then download or delete them at any time. Files are stored per account and are not shared with other users.",
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
