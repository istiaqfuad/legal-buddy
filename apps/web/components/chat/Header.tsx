"use client";

import { Scale, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header({
  onClear,
  canClear,
}: {
  onClear: () => void;
  canClear: boolean;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Scale className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold tracking-tight">Law Buddy</h1>
            <p className="text-xs text-muted">Legal answers, cited</p>
          </div>
        </div>
        {canClear && (
          <Button variant="ghost" size="sm" onClick={onClear} aria-label="Clear conversation">
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        )}
      </div>
    </header>
  );
}
