import { MessageSquareText, DatabaseZap, BadgeCheck } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    n: "01",
    icon: MessageSquareText,
    title: "Ask in plain words",
    copy: "“Can police arrest without a warrant?” No section numbers needed. Follow-ups work too — Law Buddy remembers the last 6 turns.",
  },
  {
    n: "02",
    icon: DatabaseZap,
    title: "We retrieve the law",
    copy: "Your question is embedded and matched against thousands of indexed sections. Top matches above the confidence floor survive.",
  },
  {
    n: "03",
    icon: BadgeCheck,
    title: "You get cited answers",
    copy: "The model answers only from retrieved sections. Hover any [N] to preview the source, click to pin it, verify externally.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="ink-canvas relative scroll-mt-24 overflow-hidden py-24 sm:py-32">
      <div className="grid-overlay absolute inset-0 opacity-70" />
      <div className="noise-overlay absolute inset-0" />
      <div className="orb orb-a left-[10%] top-[20%] h-[360px] w-[360px] bg-emerald-500/20" />
      <div className="orb orb-b right-[5%] top-[60%] h-[320px] w-[320px] bg-amber-400/12" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          dark
          eyebrow="How it works"
          title={<>Three steps. <span className="text-gradient-gold">Zero guesswork.</span></>}
          copy="A production RAG pipeline — embeddings on CPU, Qdrant vector search, grounded generation — wrapped in an interface anyone can use."
        />

        <div className="relative mt-14 grid gap-5 lg:grid-cols-3">
          <div className="absolute left-[16%] right-[16%] top-16 hidden h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent lg:block" />
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i as 0 | 1 | 2}>
              <article className="glass-dark lift relative h-full rounded-3xl p-8">
                <div className="flex items-start justify-between">
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-600 p-3.5 text-[#1a1405] shadow-lg">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <span className="font-display text-5xl font-semibold text-white/12">{s.n}</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-tight text-white">{s.title}</h3>
                <p className="mt-2.5 leading-relaxed text-white/60">{s.copy}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
