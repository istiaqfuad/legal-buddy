"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const SCENES = [
  {
    q: "What are the grounds for a writ petition?",
    a: "Under Article 102 of the Constitution, the High Court Division may issue certiorari, mandamus, prohibition, quo warranto and habeas corpus where there is no other efficacious remedy",
    cites: ["1", "2"],
    sources: [
      { n: 1, title: "Constitution of Bangladesh", meta: "Art. 102 · score 0.904" },
      { n: 2, title: "Code of Civil Procedure", meta: "Sec. 115 · score 0.861" },
    ],
  },
  {
    q: "How is culpable homicide defined?",
    a: "Section 299 defines culpable homicide as causing death by doing an act with the intention or knowledge specified therein. Section 300 then carves out murder, with five exceptions reducing it back to culpable homicide",
    cites: ["1", "2"],
    sources: [
      { n: 1, title: "The Penal Code, 1860", meta: "Sec. 299 · score 0.918" },
      { n: 2, title: "The Penal Code, 1860", meta: "Sec. 300 · score 0.897" },
    ],
  },
  {
    q: "Can a confession to police be proved?",
    a: "No. Section 25 bars proof of confessions made to a police officer, and Section 26 extends the bar to confessions in police custody unless made before a Magistrate",
    cites: ["1", "2"],
    sources: [
      { n: 1, title: "Evidence Act, 1872", meta: "Sec. 25 · score 0.925" },
      { n: 2, title: "Evidence Act, 1872", meta: "Sec. 26 · score 0.890" },
    ],
  },
];

export function LiveDemo() {
  const [scene, setScene] = useState(0);
  const advance = useCallback(() => setScene((s) => (s + 1) % SCENES.length), []);

  return (
    <section id="demo" className="scroll-mt-24 bg-bg py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Live demo"
          title={<>Watch it think, <em className="font-display italic text-accent">cite</em>, verify.</>}
          copy="A looping preview of the real chat experience. The answers below are illustrative — sign in to query the live index."
        />

        <div className="mx-auto mt-12 grid max-w-5xl gap-4 lg:grid-cols-[1fr_280px]">
          <Reveal>
            <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_24px_70px_-30px_rgba(6,13,11,0.4)]">
              <div className="flex items-center justify-between border-b border-line bg-surface-2/60 px-5 py-3">
                <div className="flex items-center gap-2">
                  <Logo className="h-6 w-6" />
                  <span className="text-sm font-semibold text-text">Law Buddy · live</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    {SCENES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setScene(i)}
                        aria-label={`Demo ${i + 1}`}
                        className={cn("h-1.5 rounded-full transition-all", i === scene ? "w-6 bg-accent" : "w-1.5 bg-line hover:bg-faint")}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setScene((s) => (s + 1) % SCENES.length)}
                    aria-label="Replay demo"
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-accent-soft hover:text-accent-strong"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <DemoTranscript
                key={scene}
                scene={SCENES[scene]}
                onDone={advance}
              />

              <div className="border-t border-line px-5 py-4">
                <Link href="/chat" className="btn-emerald btn-shine group flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-[15px] font-bold text-white">
                  Try it on your own question
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={1}>
            <div className="flex h-full flex-col gap-4">
              {[
                { k: "Confidence gate", v: "Low-match queries get a clarifying question, not a fabrication." },
                { k: "History-aware", v: "Follow-ups resolve against the last 6 turns of context." },
                { k: "Tunable", v: "Top-K 3–12, clarify floors, model swap — in Settings." },
              ].map((f) => (
                <div key={f.k} className="flex-1 rounded-3xl border border-line bg-surface p-5">
                  <p className="text-sm font-bold uppercase tracking-wider text-accent">{f.k}</p>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{f.v}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// Keyed by scene so typing state resets via remount — no reset effect needed.
function DemoTranscript({
  scene,
  onDone,
}: {
  scene: (typeof SCENES)[number];
  onDone: () => void;
}) {
  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState<"question" | "answer" | "done">("question");

  useEffect(() => {
    const text = phase === "question" ? scene.q : scene.a;
    if (typed >= text.length) {
      const t = setTimeout(() => {
        if (phase === "question") setPhase("answer");
        else setPhase("done");
      }, phase === "question" ? 500 : 2600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setTyped((v) => v + 1),
      phase === "question" ? 34 : 14
    );
    return () => clearTimeout(t);
  }, [typed, phase, scene]);

  // auto-advance once the scene has fully played
  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(onDone, 4200);
    return () => clearTimeout(t);
  }, [phase, onDone]);

  const qText = phase === "question" ? scene.q.slice(0, typed) : scene.q;
  const aText = phase === "answer" ? scene.a.slice(0, typed) : phase === "done" ? scene.a : "";

  return (
    <div className="min-h-[300px] space-y-4 p-5 sm:p-6">
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-3 text-[15px] font-medium leading-relaxed text-white shadow-md">
          {qText}
          {phase === "question" && <span className="typing-caret ml-0.5 inline-block w-[2px] bg-white/80">&nbsp;</span>}
        </div>
      </div>
      {(phase === "answer" || phase === "done") && (
        <div className="rise flex gap-3">
          <Logo className="mt-1 h-7 w-7 shrink-0" />
          <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-line bg-bg px-4 py-3.5">
            <p className="text-[15px] leading-relaxed text-text">
              {aText}
              {phase === "done" && (
                <>
                  {scene.cites.map((c) => (
                    <span key={c} className="cite" data-active="true">{c}</span>
                  ))}
                  .
                </>
              )}
              {phase === "answer" && <span className="stream-caret" />}
            </p>
            {phase === "done" && (
              <div className="fade-in mt-3 space-y-1.5 border-t border-line pt-3">
                {scene.sources.map((s) => (
                  <div key={s.n} className="flex items-center gap-2.5 text-[13px]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent text-[11px] font-bold text-white">{s.n}</span>
                    <span className="font-semibold text-text">{s.title}</span>
                    <span className="text-faint">{s.meta}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
