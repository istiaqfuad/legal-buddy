"use client";

import { FlaskConical, Scale, Trash2 } from "lucide-react";
import {
  type ChatSettings,
  type Provider,
  PROVIDER_MODELS,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PROVIDERS: Provider[] = ["gemini", "groq"];

export function SidebarContent({
  settings,
  onChange,
  onClear,
  canClear,
}: {
  settings: ChatSettings;
  onChange: (next: ChatSettings) => void;
  onClear: () => void;
  canClear: boolean;
}) {
  const set = (patch: Partial<ChatSettings>) => onChange({ ...settings, ...patch });
  const pickProvider = (provider: Provider) =>
    set({ provider, model: PROVIDER_MODELS[provider][0] });

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Scale className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">Law Buddy</p>
          <p className="text-xs text-muted">Legal answers, cited</p>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-2">
        {/* Retrieval */}
        <Field label="Sources to retrieve" value={settings.topK}>
          <input
            type="range"
            min={3}
            max={12}
            step={1}
            value={settings.topK}
            onChange={(e) => set({ topK: Number(e.target.value) })}
            aria-label="Sources to retrieve"
            aria-valuetext={`${settings.topK} sources`}
            className="w-full accent-accent"
          />
          <p className="mt-1 text-xs text-muted">
            How many statute sections to ground the answer on.
          </p>
        </Field>

        {/* Model (dev-only) */}
        <fieldset className="space-y-4 rounded-xl border border-dashed border-border p-3">
          <legend className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted">
            <FlaskConical className="h-3.5 w-3.5" /> Model (dev only)
          </legend>

          {/* Provider */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-foreground">Provider</p>
            <div role="radiogroup" aria-label="LLM provider" className="flex rounded-lg border border-border p-0.5">
              {PROVIDERS.map((p) => (
                <button
                  key={p}
                  role="radio"
                  aria-checked={settings.provider === p}
                  onClick={() => pickProvider(p)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize transition-colors",
                    settings.provider === p
                      ? "bg-accent text-accent-foreground"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Model */}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-foreground">Model</span>
            <input
              list="sidebar-model-options"
              value={settings.model}
              onChange={(e) => set({ model: e.target.value })}
              placeholder="provider default"
              className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
            />
            <datalist id="sidebar-model-options">
              {PROVIDER_MODELS[settings.provider].map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </label>

          {/* Temperature */}
          <label className="block space-y-1.5">
            <span className="flex justify-between text-xs font-medium text-foreground">
              Temperature
              <span className="font-mono text-muted">{settings.temperature.toFixed(1)}</span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={settings.temperature}
              onChange={(e) => set({ temperature: Number(e.target.value) })}
              aria-label="Temperature"
              className="w-full accent-accent"
            />
          </label>

          {/* Max tokens */}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-foreground">Max tokens</span>
            <input
              type="number"
              min={1}
              value={settings.maxTokens ?? ""}
              onChange={(e) => set({ maxTokens: e.target.value ? Number(e.target.value) : null })}
              placeholder="auto"
              className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </fieldset>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          disabled={!canClear}
          className="w-full"
        >
          <Trash2 className="h-4 w-4" />
          Clear conversation
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{label}</span>
        <span className="rounded-md bg-user-bubble px-1.5 py-0.5 font-mono text-xs text-foreground">
          {value}
        </span>
      </div>
      {children}
    </div>
  );
}
