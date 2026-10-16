"use client";

import { useRef, useEffect } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div
      className={cn(
        "group relative flex items-end gap-2 rounded-[24px] border bg-surface p-2.5 pl-5 shadow-[0_16px_44px_-20px_rgba(6,13,11,0.35)] transition-all duration-300",
        "border-line hover:border-accent/35 focus-within:border-accent/50 focus-within:shadow-[0_16px_50px_-16px_rgba(20,113,83,0.45)] focus-within:ring-4 focus-within:ring-accent/10"
      )}
    >
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
        placeholder="Ask about theft, bail, writs, evidence…"
        className="block max-h-[200px] flex-1 resize-none bg-transparent py-2.5 text-[15.5px] leading-relaxed text-text outline-none placeholder:text-faint"
      />
      <span className="mb-3 hidden text-[11px] font-medium text-faint lg:block">
        ⏎ send · ⇧⏎ newline
      </span>
      <button
        type="button"
        onClick={onSend}
        disabled={!canSend}
        aria-label="Send"
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          canSend
            ? "bg-gradient-to-b from-[#1d8a66] to-[#0e5a42] text-white shadow-[0_10px_24px_-8px_rgba(20,113,83,0.7)] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
            : "cursor-not-allowed bg-surface-2 text-faint"
        )}
      >
        {loading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <ArrowUp className="h-5 w-5" strokeWidth={2.5} />}
      </button>
    </div>
  );
}
