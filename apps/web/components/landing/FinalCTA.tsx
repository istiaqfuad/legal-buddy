import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";

export function FinalCTA() {
  return (
    <section className="bg-bg pb-24 pt-4 sm:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="ink-canvas card-ring relative overflow-hidden rounded-[32px] px-6 py-16 text-center sm:px-12 sm:py-20">
            <div className="grid-overlay absolute inset-0" />
            <div className="orb orb-a left-[15%] top-[-40px] h-[280px] w-[280px] bg-emerald-500/25" />
            <div className="orb orb-b right-[10%] bottom-[-60px] h-[300px] w-[300px] bg-amber-400/18" />
            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-200/80">
                Free plan · no card required
              </p>
              <h2 className="font-display mx-auto mt-4 max-w-2xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl">
                Ask your next legal question <span className="text-gradient-gold">with the source in view.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/60">
                Start free. Get five sourced answers a day, read the explanation,
                then open the act and section behind it.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/chat"
                  className="btn-shine btn-primary-gold group inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-[15px] font-bold"
                >
                  Start free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="#pricing"
                  className="inline-flex items-center rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-[15px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
                >
                  Compare plans
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
