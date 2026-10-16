"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, BookOpenCheck } from "lucide-react";
import type { Source } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SourceList({
  sources,
  activeCite,
  onHover,
  open,
  onOpenChange,
}: {
  sources: Source[];
  activeCite?: number | null;
  onHover?: (n: number | null) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const toggle = () => (onOpenChange ? onOpenChange(!isOpen) : setInternalOpen((v) => !v));
  if (!sources.length) return null;

  return (
    <div className="mt-4">
      <button
        onClick={toggle}
        className="group inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px] font-semibold text-muted shadow-sm transition-all hover:border-accent/40 hover:text-accent-strong"
        aria-expanded={isOpen}
      >
        <BookOpenCheck className="h-3.5 w-3.5 text-accent" />
        {sources.length} {sources.length === 1 ? "verified source" : "verified sources"}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <ol className="mt-2.5 space-y-2">
          {sources.map((s, idx) => {
            const active = activeCite === s.citation_id;
            return (
              <li
                key={s.citation_id}
                data-source={s.citation_id}
                onMouseEnter={() => onHover?.(s.citation_id)}
                onMouseLeave={() => onHover?.(null)}
                style={{ animationDelay: `${Math.min(idx * 60, 300)}ms` }}
                className={cn(
                  "rise flex gap-3 rounded-2xl border p-3.5 transition-all duration-200",
                  active
                    ? "border-accent/50 bg-accent-soft shadow-[0_8px_28px_-12px_rgba(20,113,83,0.5)] ring-2 ring-accent/20"
                    : "border-line bg-surface hover:border-accent/30 hover:shadow-md",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 min-w-6 shrink-0 items-center justify-center rounded-lg px-1.5 text-xs font-bold tabular-nums transition-all",
                    active
                      ? "bg-gradient-to-b from-[#1d8a66] to-[#0e5a42] text-white shadow"
                      : "bg-accent-soft text-accent-strong",
                  )}
                >
                  {s.citation_id}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[14px] font-semibold leading-snug text-text">
                      {cleanTitle(s.act_title)}
                      {s.act_year ? <span className="font-normal text-muted"> ({s.act_year})</span> : null}
                    </p>
                    {s.source_url && (
                      <a
                        href={s.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex shrink-0 items-center gap-1 rounded-lg bg-surface-2 px-2 py-1 text-[11px] font-semibold text-muted transition-colors hover:bg-accent-soft hover:text-accent-strong"
                        aria-label="Open original source"
                      >
                        <ExternalLink className="h-3 w-3" /> Verify
                      </a>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <p className="text-[12px] font-medium text-faint">
                      Section {s.section_index ?? "—"}
                    </p>
                    <span className="h-1 w-1 rounded-full bg-line" />
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            s.score >= 0.85 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : s.score >= 0.8 ? "bg-gradient-to-r from-amber-500 to-amber-300" : "bg-faint"
                          )}
                          style={{ width: `${Math.round(s.score * 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold tabular-nums text-muted">{s.score.toFixed(3)}</span>
                    </div>
                  </div>
                  {s.excerpt && (
                    <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-muted">
                      {s.excerpt}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// Source titles in the data sometimes carry a stray leading digit, e.g. "1The Penal Code".
function cleanTitle(title: string | null): string {
  if (!title) return "Unknown Act";
  return title.replace(/^\d+(?=[A-Z])/, "");
}
