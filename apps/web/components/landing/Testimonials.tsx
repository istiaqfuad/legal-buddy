import { Star, Quote } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

const QUOTES = [
  {
    quote: "I verified every citation for my writ assignment. All three pointed to the exact article and section. My supervisor thought I'd spent a week in the library.",
    name: "Nusrat J.",
    role: "LLB Student, Dhaka University",
    initials: "NJ",
  },
  {
    quote: "Drafting opinions used to mean flipping through three bare acts. Now I confirm the section in Law Buddy first, then read the full text. Research time is down by half.",
    name: "Adv. Tanvir H.",
    role: "Advocate, Dhaka Judge Court",
    initials: "TH",
  },
  {
    quote: "Our HR team checks Labour Act clauses before every termination letter. The clickable sources mean our counsel can verify in seconds instead of days.",
    name: "Farhana R.",
    role: "Startup Founder, Dhaka",
    initials: "FR",
  },
];

export function Testimonials() {
  return (
    <section className="border-y border-line bg-surface-2/50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Loved in chambers & classrooms"
          title={<>People stopped <em className="font-display italic text-accent">guessing</em> the section.</>}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {QUOTES.map((t, i) => (
            <Reveal key={t.name} delay={i as 0 | 1 | 2}>
              <figure className="lift relative flex h-full flex-col rounded-3xl border border-line bg-surface p-7">
                <Quote className="h-7 w-7 text-gold" />
                <div className="mt-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="mt-3 flex-1 text-[15.5px] leading-relaxed text-text">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-strong text-sm font-bold text-white">
                    {t.initials}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-text">{t.name}</span>
                    <span className="block text-[13px] text-muted">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-faint">Illustrative testimonials for preview — real user stories coming soon.</p>
      </div>
    </section>
  );
}
