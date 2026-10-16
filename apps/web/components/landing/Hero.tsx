import Link from "next/link";
import { ArrowRight, Play, Scale, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const STATS = [
  { value: "2,400+", label: "Statute sections indexed" },
  { value: "40+", label: "Acts & ordinances covered" },
  { value: "§-level", label: "Citation granularity" },
  { value: "< 8s", label: "Median cited answer" },
];

export function Hero() {
  return (
    <section className="ink-canvas relative overflow-hidden pt-32 sm:pt-40">
      <div className="grid-overlay absolute inset-0" />
      <div className="noise-overlay absolute inset-0" />
      <div className="orb orb-a left-[-120px] top-[10%] h-[420px] w-[420px] bg-emerald-500/25" />
      <div className="orb orb-b right-[-140px] top-[-60px] h-[480px] w-[480px] bg-amber-400/15" />
      <div className="orb left-[38%] top-[46%] h-[300px] w-[520px] bg-teal-400/10 blur-[110px]" />

      {/* fine gold rule at very top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* Copy */}
          <div className="max-w-2xl">
            <div className="hero-rise hero-d1 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 py-1.5 pl-1.5 pr-4 backdrop-blur">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#1a1405]">
                <Sparkles className="h-3 w-3" /> New
              </span>
              <span className="whitespace-nowrap text-[12px] font-medium text-white/75 sm:text-[13px]">
                GPT-OSS 120B + Gemini retrieval — now live
              </span>
            </div>

            <h1 className="hero-rise hero-d2 font-display mt-7 text-balance text-[2.9rem] font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[4.4rem]">
              Bangladesh law,
              <br />
              answered with{" "}
              <em className="text-gradient-gold not-italic sm:italic">receipts.</em>
            </h1>

            <p className="hero-rise hero-d3 mt-6 max-w-xl text-pretty text-lg leading-relaxed text-white/60">
              Ask in plain Bangla or English. Law Buddy retrieves the exact
              sections from the Penal Code, CrPC, Evidence Act & more — then
              answers with{" "}
              <span className="font-semibold text-white/90">clickable §-level citations</span>{" "}
              you can verify in one tap.
            </p>

            <div className="hero-rise hero-d4 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/chat"
                className="btn-shine btn-primary-gold group inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-[15px] font-bold"
              >
                Ask your first question
                <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#demo"
                className="group inline-flex items-center justify-center gap-2.5 rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-[15px] font-semibold text-white backdrop-blur transition-all hover:border-white/30 hover:bg-white/10"
              >
                <span className="pulse-ring flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <Play className="h-3.5 w-3.5 fill-white text-white" />
                </span>
                Watch it reason
              </a>
            </div>

            <div className="hero-rise hero-d5 mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/50">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-300" /> Grounded — never hallucinates sections
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-300" /> Free 5 queries/day, no card
              </span>
            </div>
          </div>

          {/* Visual — floating glass chat card */}
          <div className="hero-rise hero-d4 relative mx-auto w-full max-w-[520px] lg:max-w-none">
            <div className="absolute -inset-8 rounded-[32px] bg-gradient-to-br from-emerald-400/15 via-transparent to-amber-300/15 blur-2xl" />
            <div className="glass-dark card-ring float-y relative rounded-3xl p-5 shadow-2xl sm:p-6">
              {/* window chrome */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  </span>
                  GROUNDED · 6 SOURCES
                </div>
              </div>

              {/* user bubble */}
              <div className="mt-5 flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-emerald-400 to-emerald-600 px-4 py-3 text-[14px] font-medium leading-relaxed text-white shadow-lg">
                  What is the punishment for theft under the Penal Code?
                </div>
              </div>

              {/* assistant card */}
              <div className="mt-3 rounded-2xl border border-white/10 bg-[#0b1411]/90 p-4">
                <div className="flex items-center gap-2">
                  <Logo className="h-6 w-6" />
                  <span className="text-[12px] font-semibold uppercase tracking-wider text-white/50">
                    Law Buddy · answered in 6.2s
                  </span>
                </div>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-white/85">
                  Under <span className="font-semibold text-white">Section 379</span>, whoever
                  commits theft faces imprisonment up to{" "}
                  <span className="font-semibold whitespace-nowrap text-amber-200">3 years</span>, or fine, or
                  both<button className="cite !text-[11px]" tabIndex={-1}>1</button><button className="cite !text-[11px]" tabIndex={-1}>2</button>.
                  Dishonest misappropriation is separately covered u/s 403<button className="cite !text-[11px]" tabIndex={-1}>3</button>.
                </p>
                <div className="relative mt-3 overflow-hidden rounded-xl border border-emerald-300/20 bg-emerald-300/8 p-3">
                  <div className="beam absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-emerald-200/15 to-transparent" />
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-400 text-[12px] font-bold text-emerald-950">1</span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-white">The Penal Code, 1860</p>
                      <p className="text-[12px] text-white/50">Section 379 · score 0.912 · verified</p>
                    </div>
                    <Scale className="ml-auto h-4 w-4 shrink-0 text-emerald-300" />
                  </div>
                </div>
              </div>

              {/* composer mock */}
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/12 bg-white/6 px-4 py-3">
                <span className="flex-1 text-[13.5px] text-white/40">Ask about bail, writs, evidence…</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-sm font-bold text-[#1a1405]">↑</span>
              </div>
            </div>

            {/* floating chips */}
            <div className="float-y-slow absolute -left-4 top-16 hidden rounded-2xl border border-white/12 bg-[#0c1714]/95 px-4 py-3 shadow-xl backdrop-blur sm:block lg:-left-10">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-200/80">Citation match</p>
              <p className="font-display text-2xl font-semibold text-white">0.912</p>
            </div>
            <div className="float-y absolute -right-3 bottom-28 hidden rounded-2xl border border-white/12 bg-[#0c1714]/95 px-4 py-3 shadow-xl backdrop-blur sm:block lg:-right-8" style={{ animationDelay: "1.4s" }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-200/80">Zero hallucinations</p>
              <p className="text-sm font-semibold text-white">Every claim → a section</p>
            </div>
          </div>
        </div>

        {/* stats */}
        <div className="hero-rise hero-d5 relative mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:mt-20 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-[#080f0c]/90 px-6 py-5 backdrop-blur">
              <p className="font-display text-2xl font-semibold text-white sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-[13px] text-white/50">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* curve into next section */}
      <div className="relative mt-16 h-10 bg-[#f6f6f3] [clip-path:ellipse(75%_100%_at_50%_100%)] dark:bg-[#0c100e]" />
    </section>
  );
}
