"use client";

import { useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertCircle } from "lucide-react";
import type { Turn, Source } from "@/lib/types";
import { SourceList } from "./SourceList";

export function Message({ turn }: { turn: Turn }) {
  // Active citation drives the claim↔source highlight, scoped to this answer.
  const [activeCite, setActiveCite] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  if (turn.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-surface px-4 py-2.5 text-[15px] leading-relaxed text-text shadow-sm ring-1 ring-line">
          {turn.content}
        </div>
      </div>
    );
  }

  if (turn.error) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-[15px] text-danger">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{turn.content}</span>
      </div>
    );
  }

  const sources = turn.sources ?? [];
  const linked = linkifyCitations(turn.content, sources);

  const scrollToSource = (n: number) => {
    rootRef.current
      ?.querySelector(`[data-source="${n}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const components: Components = {
    a({ href, children }) {
      const text = String(Array.isArray(children) ? children.join("") : children ?? "").trim();
      const n = /^\d+$/.test(text) ? Number(text) : null;

      if (n === null) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
          >
            {children}
          </a>
        );
      }

      const shared = {
        className: "cite",
        "data-active": activeCite === n ? "true" : undefined,
        onMouseEnter: () => setActiveCite(n),
        onMouseLeave: () => setActiveCite(null),
        onFocus: () => setActiveCite(n),
        onBlur: () => setActiveCite(null),
      } as const;

      return href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Source ${n}, opens reference`} {...shared}>
          {n}
        </a>
      ) : (
        <button type="button" aria-label={`Source ${n}`} onClick={() => scrollToSource(n)} {...shared}>
          {n}
        </button>
      );
    },
  };

  return (
    <div ref={rootRef} className="rise flex flex-col">
      <div className="answer-prose max-w-full break-words text-text">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {linked}
        </ReactMarkdown>
      </div>
      <SourceList sources={sources} activeCite={activeCite} onHover={setActiveCite} />
    </div>
  );
}

// Render the API's "[Source N]" citations as compact "[N]" reference marks. The
// link text is the bare number; styling/superscript comes from CSS (.cite).
// Citations that resolve to a source URL link out; the rest carry a "cite:" href
// that React-Markdown strips, so they fall through to a scroll button. Handles
// every shape the model emits — "[Source 2]", "[Source 2, 5]", "[Sources 2 and
// 5]" — expanding each number to its own marker.
function linkifyCitations(answer: string, sources: Source[]): string {
  const byId = new Map(sources.map((s) => [s.citation_id, s]));
  return answer.replace(/\[Sources?\b[^\]]*\]/gi, (block) => {
    const nums = block.match(/\d+/g);
    if (!nums) return block;
    return nums
      .map((n) => {
        const src = byId.get(Number(n));
        return src?.source_url ? `[${n}](${src.source_url})` : `[${n}](cite:${n})`;
      })
      .join(" ");
  });
}
