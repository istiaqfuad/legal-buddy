import { FileCheck2, BrainCircuit, Link2, SlidersHorizontal, ShieldCheck, Languages } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

const CARDS = [
  {
    icon: FileCheck2,
    title: "Section-level citations",
    copy: "Every sentence that matters carries a [1][2] mark. Click it and the exact act, section number and similarity score glide into view.",
    span: "lg:col-span-2",
    accent: true,
  },
  {
    icon: BrainCircuit,
    title: "Grounded RAG, not vibes",
    copy: "Top-K statute retrieval feeds the model. Low-confidence questions trigger a clarifying question instead of a confident fiction.",
    span: "",
    accent: false,
  },
  {
    icon: Link2,
    title: "Verify in one tap",
    copy: "Each source links out to the original text. Check the section yourself — trust, but verify.",
    span: "",
    accent: false,
  },
  {
    icon: Languages,
    title: "Bangla + English",
    copy: "Ask the way you think. Colloquial Bangla, formal English, or a mix — retrieval understands both.",
    span: "",
    accent: false,
  },
  {
    icon: SlidersHorizontal,
    title: "Tunable retrieval",
    copy: "Dial sources from 3–12, set clarify floors, swap Gemini / Groq / self-hosted models. Power users welcome.",
    span: "",
    accent: false,
  },
  {
    icon: ShieldCheck,
    title: "Honest by design",
    copy: "General information with a clear not-legal-advice boundary. Rate-limited, abuse-guarded, and private.",
    span: "lg:col-span-2",
    accent: true,
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 bg-bg py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Why Law Buddy"
          title={<>Built for answers you can <em className="font-display italic text-accent">defend</em>.</>}
          copy="Most chatbots sound confident and cite nothing. Law Buddy inverts that: retrieval first, generation second, verification always."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c, i) => (
            <Reveal key={c.title} delay={(i % 4) as 0 | 1 | 2 | 3} className={c.span}>
              <article
                className={`lift group relative h-full overflow-hidden rounded-3xl border p-7 ${
                  c.accent
                    ? "border-accent/25 bg-gradient-to-br from-accent-soft via-surface to-gold-soft"
                    : "border-line bg-surface"
                }`}
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/8 blur-2xl transition-all duration-500 group-hover:bg-accent/15" />
                <div className="relative">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-strong text-white shadow-lg">
                    <c.icon className="h-5.5 w-5.5" />
                  </div>
                  <h3 className="mt-5 text-[19px] font-semibold tracking-tight text-text">{c.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{c.copy}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
