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
    <div className="mt-3">
      <button
        onClick={toggle}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted transition-colors hover:text-text"
        aria-expanded={isOpen}
      >
        <BookOpenCheck className="h-3.5 w-3.5" />
        {sources.length} {sources.length === 1 ? "source" : "sources"}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <ol className="mt-2 space-y-1.5">
          {sources.map((s) => {
            const active = activeCite === s.citation_id;
            return (
              <li
                key={s.citation_id}
                data-source={s.citation_id}
                onMouseEnter={() => onHover?.(s.citation_id)}
                onMouseLeave={() => onHover?.(null)}
                className={cn(
                  "flex gap-2.5 rounded-lg border p-3 transition-colors",
                  active
                    ? "border-accent/40 bg-accent-soft/40"
                    : "border-line bg-surface hover:border-accent/30",
                )}
              >
                <span className="mt-0.5 flex h-5 min-w-5 shrink-0 items-center justify-center rounded px-1 text-[11px] font-semibold tabular-nums text-muted">
                  {s.citation_id}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[13.5px] font-medium leading-snug text-text">
                      {cleanTitle(s.act_title)}
                      {s.act_year ? <span className="font-normal text-muted"> ({s.act_year})</span> : null}
                    </p>
                    {s.source_url && (
                      <a
                        href={s.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted transition-colors hover:text-accent"
                        aria-label="Open original source"
                      >
                        <ExternalLink className="h-3 w-3" /> Verify
                      </a>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-faint">
                    Section {s.section_index ?? "—"}
                  </p>
                  {s.excerpt && (
                    <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-relaxed text-muted">
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
