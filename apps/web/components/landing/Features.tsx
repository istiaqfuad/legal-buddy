import { FileCheck2, BrainCircuit, Link2, SlidersHorizontal, ShieldCheck, Languages } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

const CARDS = [
  {
    icon: FileCheck2,
    title: "Every answer points to a section",
    copy: "The explanation is tied to the act and section it comes from. Open the source and read the exact wording for yourself.",
    span: "lg:col-span-2",
    accent: true,
  },
  {
    icon: BrainCircuit,
    title: "Search that starts with the law",
    copy: "Your question is matched against a library of Bangladeshi statutes before an answer is written. If the match is weak, you get a follow-up question instead of a guess.",
    span: "",
    accent: false,
  },
  {
    icon: Link2,
    title: "Check the original text",
    copy: "Each source opens the act itself, so you can confirm the wording before you rely on it.",
    span: "",
    accent: false,
  },
  {
    icon: Languages,
    title: "Ask in Bangla or English",
    copy: "Write the way you normally would. LegalBuddy understands both, including a mix of the two.",
    span: "",
    accent: false,
  },
  {
    icon: SlidersHorizontal,
    title: "Choose how wide to search",
    copy: "Use more sources when a question is broad, or fewer when you need a quick answer. The search settings are yours to adjust.",
    span: "",
    accent: false,
  },
  {
    icon: ShieldCheck,
    title: "Private, with a clear boundary",
    copy: "Your conversations and documents stay in your account. Answers are general legal information, not legal advice.",
    span: "lg:col-span-2",
    accent: true,
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 bg-bg py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Why LegalBuddy"
          title={<>Answers you can <em className="font-display italic text-accent">check</em>, not just trust.</>}
          copy="LegalBuddy starts with the statute, then explains it. You get a short answer, the sections behind it and a link to the original text."
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
