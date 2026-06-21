"use client";

import { useRef, useEffect } from "react";
import { ArrowUp, Minus, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_K = 3;
const MAX_K = 12;

export function Composer({
  value,
  onChange,
  onSend,
  loading,
  topK,
  onTopK,
  onToggleSettings,
  settingsOpen,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  loading: boolean;
  topK: number;
  onTopK: (k: number) => void;
  onToggleSettings: () => void;
  settingsOpen: boolean;
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
    <div className="rounded-2xl border border-border bg-surface shadow-sm focus-within:ring-2 focus-within:ring-ring">
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a legal question…"
        className="block max-h-[200px] w-full resize-none bg-transparent px-4 pt-3.5 text-sm outline-none placeholder:text-muted"
      />
      <div className="flex items-center justify-between gap-2 px-3 pb-2.5 pt-1">
        <div className="flex items-center gap-2 text-xs text-muted">
          <button
            onClick={onToggleSettings}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg border border-border transition-colors hover:text-foreground",
              settingsOpen && "bg-accent-soft text-accent",
            )}
            aria-label="Test settings"
            aria-pressed={settingsOpen}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
          <span className="hidden sm:inline">Sources</span>
          <div className="flex items-center gap-0.5 rounded-lg border border-border">
            <button
              onClick={() => onTopK(Math.max(MIN_K, topK - 1))}
              disabled={topK <= MIN_K}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:text-foreground disabled:opacity-40"
              aria-label="Fewer sources"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-4 text-center font-medium text-foreground">{topK}</span>
            <button
              onClick={() => onTopK(Math.min(MAX_K, topK + 1))}
              disabled={topK >= MAX_K}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted hover:text-foreground disabled:opacity-40"
              aria-label="More sources"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
        <Button
          size="icon"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send"
          className="rounded-xl"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
