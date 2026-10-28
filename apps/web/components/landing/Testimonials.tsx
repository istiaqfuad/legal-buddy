import { Building2, Check, GraduationCap, Scale } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { Reveal } from "./Reveal";

const AUDIENCES = [
  {
    icon: GraduationCap,
    label: "For law students",
    title: "Check your reading before you cite it.",
    copy: "Use LegalBuddy to find the provision behind a case comment or assignment, then open the act and read the exact wording for yourself.",
    points: [
      "Find the section behind a discussion",
      "Read a plain-language explanation first",
      "Quote from the original text",
    ],
  },
  {
    icon: Scale,
    label: "For advocates",
    title: "Find the provision you half-remember.",
    copy: "Look up the section, confirm the wording and move on to the draft. The citation trail keeps the research easy to verify.",
    points: [
      "Search by situation, not section number",
      "Check the act before drafting",
      "Keep related research in one account",
    ],
  },
  {
    icon: Building2,
    label: "For businesses and HR teams",
    title: "Look it up before the meeting.",
    copy: "Check Labour Act, contract and company law provisions without digging through a bare act. Keep the relevant documents with the research.",
    points: [
      "Prepare for a workplace or contract question",
      "Store the supporting files with your account",
      "Share a clear source with your counsel",
    ],
  },
];

export function Testimonials() {
  return (
    <section id="who-its-for" className="scroll-mt-24 border-y border-line bg-surface-2/50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Who it is for"
          title={<>Built for the way people actually <em className="font-display italic text-accent">look up</em> the law.</>}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {AUDIENCES.map((audience, i) => (
            <Reveal key={audience.label} delay={i as 0 | 1 | 2}>
              <article className="lift relative flex h-full flex-col rounded-3xl border border-line bg-surface p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-strong text-white shadow-lg">
                  <audience.icon className="h-5.5 w-5.5" />
                </span>
                <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                  {audience.label}
                </p>
                <h3 className="mt-1.5 text-[19px] font-semibold tracking-tight text-text">
                  {audience.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
                  {audience.copy}
                </p>
                <ul className="mt-5 space-y-2 border-t border-line pt-5">
                  {audience.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-[14px] text-text">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
