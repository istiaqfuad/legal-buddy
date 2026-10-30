"use client";

import { useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertCircle, Scale } from "lucide-react";
import type { Turn } from "@/lib/types";
import { SourceList } from "./SourceList";

export function Message({ turn }: { turn: Turn }) {
  const [hoverCite, setHoverCite] = useState<number | null>(null);
  const [pinnedCite, setPinnedCite] = useState<number | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const activeCite = hoverCite ?? pinnedCite;
  const rootRef = useRef<HTMLDivElement>(null);

  if (turn.role === "user") {
    return (
      <div className="rise flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md border border-line bg-surface-2 px-4 py-2.5 text-[15px] leading-relaxed text-text">
          {turn.content}
        </div>
      </div>
    );
  }

  if (turn.error) {
    return (
      <div className="rise flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-[14px] leading-relaxed text-danger">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{turn.content}</span>
      </div>
    );
  }

  const sources = turn.sources ?? [];
  const linked = linkifyCitations(turn.content);
  const streaming = turn.content.length === 0;

  const revealSource = (n: number) => {
    setPinnedCite(n);
    setSourcesOpen(true);
    requestAnimationFrame(() => {
      rootRef.current
        ?.querySelector(`[data-source="${n}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
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
            className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
          >
            {children}
          </a>
        );
      }

      return (
        <button
          type="button"
          className="cite"
          data-active={activeCite === n ? "true" : undefined}
          aria-label={`Source ${n}`}
          onMouseEnter={() => setHoverCite(n)}
          onMouseLeave={() => setHoverCite(null)}
          onFocus={() => setHoverCite(n)}
          onBlur={() => setHoverCite(null)}
          onClick={() => revealSource(n)}
        >
          {n}
        </button>
      );
    },
  };

  return (
    <div ref={rootRef} className="rise flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-muted">
        <Scale className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        {streaming ? (
          <div className="flex items-center gap-1.5 py-1" role="status" aria-label="Thinking">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-faint"
                style={{ animation: "pulse-dot 1.2s ease-in-out infinite", animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        ) : (
          <div className="answer-prose max-w-full break-words text-text">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {linked}
            </ReactMarkdown>
          </div>
        )}
        <SourceList
          sources={sources}
          activeCite={activeCite}
          onHover={setHoverCite}
          open={sourcesOpen}
          onOpenChange={setSourcesOpen}
        />
      </div>
    </div>
  );
}

// Render the API's "[Source N]" citations as compact "[N]" reference marks that
// pin to the source panel — never an external link (the panel carries those).
function linkifyCitations(answer: string): string {
  return answer.replace(/[ \t]*\[Sources?\b[^\]]*\]/gi, (block) => {
    const nums = block.match(/\d+/g);
    if (!nums) return block;
    return nums.map((n) => `[${n}](cite:${n})`).join("");
  });
}
