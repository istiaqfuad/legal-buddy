"use client";

import { useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Composer({
  value,
  onChange,
  onSend,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  loading: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea up to a cap.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !loading;

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  }

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
      <label htmlFor="composer" className="sr-only">
        Ask a legal question
      </label>
      <textarea
        id="composer"
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a legal question…"
        className="block max-h-[200px] flex-1 resize-none bg-transparent px-2 py-2 text-base outline-none placeholder:text-muted"
      />
      <Button
        size="icon"
        onClick={onSend}
        disabled={!canSend}
        aria-label="Send message"
        className="rounded-xl"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </div>
  );
}
