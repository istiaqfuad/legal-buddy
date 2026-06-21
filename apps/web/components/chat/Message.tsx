"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertCircle } from "lucide-react";
import type { Turn, Source } from "@/lib/types";
import { SourceList } from "./SourceList";

export function Message({ turn }: { turn: Turn }) {
  if (turn.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-user-bubble px-4 py-2.5 text-sm">
          {turn.content}
        </div>
      </div>
    );
  }

  if (turn.error) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{turn.content}</span>
      </div>
    );
  }

  const linked = linkifyCitations(turn.content, turn.sources ?? []);
  return (
    <div className="flex flex-col">
      <div className="answer-prose max-w-full break-words text-foreground">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ ...props }) => (
              <a {...props} target="_blank" rel="noopener noreferrer" />
            ),
          }}
        >
          {linked}
        </ReactMarkdown>
      </div>
      <SourceList sources={turn.sources ?? []} />
    </div>
  );
}

// Turn "[Source 2]" into a markdown link to that source's url, mirroring the API's
// [Source N] citation convention.
function linkifyCitations(answer: string, sources: Source[]): string {
  const byId = new Map(sources.map((s) => [s.citation_id, s]));
  return answer.replace(/\[Source\s+(\d+)\]/g, (match, n) => {
    const src = byId.get(Number(n));
    return src?.source_url ? `[Source ${n}](${src.source_url})` : match;
  });
}
