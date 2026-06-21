"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, FileText } from "lucide-react";
import type { Source } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SourceList({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);
  if (!sources.length) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
        aria-expanded={open}
      >
        <FileText className="h-3.5 w-3.5" />
        {sources.length} {sources.length === 1 ? "source" : "sources"}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul className="mt-2 space-y-2">
          {sources.map((s) => (
            <li
              key={s.citation_id}
              className="rounded-xl border border-border bg-surface p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-foreground">
                    <span className="mr-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-accent-soft px-1 text-xs font-semibold text-accent">
                      {s.citation_id}
                    </span>
                    {cleanTitle(s.act_title)}
                    {s.act_year ? (
                      <span className="text-muted"> ({s.act_year})</span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    Section {s.section_index ?? "—"} · score {s.score.toFixed(3)}
                  </p>
                </div>
                {s.source_url && (
                  <a
                    href={s.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted transition-colors hover:text-accent"
                    aria-label="Open original source"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              {s.excerpt && (
                <p className="mt-2 line-clamp-4 text-[13px] leading-relaxed text-muted">
                  {s.excerpt}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Source titles in the data sometimes carry a stray leading digit, e.g. "1The Penal Code".
function cleanTitle(title: string | null): string {
  if (!title) return "Unknown Act";
  return title.replace(/^\d+(?=[A-Z])/, "");
}
