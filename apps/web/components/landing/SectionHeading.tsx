import type { ReactNode } from "react";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  copy,
  dark = false,
  align = "center",
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  copy?: string;
  dark?: boolean;
  align?: "center" | "left";
  children?: ReactNode;
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" ? "mx-auto text-center" : "text-left")}>
      <Reveal>
        <p
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]",
            dark
              ? "border-white/15 bg-white/5 text-amber-200/90"
              : "border-accent/20 bg-accent-soft text-accent-strong"
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", dark ? "bg-amber-300" : "bg-accent")} />
          {eyebrow}
        </p>
      </Reveal>
      <Reveal delay={1}>
        <h2
          className={cn(
            "font-display mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl",
            dark ? "text-white" : "text-text"
          )}
        >
          {title}
        </h2>
      </Reveal>
      {copy && (
        <Reveal delay={2}>
          <p className={cn("mt-4 text-pretty text-lg leading-relaxed", dark ? "text-white/60" : "text-muted")}>
            {copy}
          </p>
        </Reveal>
      )}
      {children}
    </div>
  );
}
