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
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Scale className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="leading-tight">
          <p className="text-base font-semibold tracking-tight">Law Buddy</p>
          <p className="text-sm text-muted">Legal answers, cited</p>
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
          <Note>
            How many statute sections are retrieved and fed to the model. More =
            broader, better-cited answers but more noise; fewer = tighter, shorter.
          </Note>
        </Field>

        {/* Model (dev-only) */}
        <fieldset className="space-y-4 rounded-xl border border-dashed border-border p-3">
          <legend className="flex items-center gap-1.5 px-1 text-sm font-medium text-muted">
            <FlaskConical className="h-4 w-4" /> Model (dev only)
          </legend>

          {/* Provider */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">Provider</p>
            <div role="radiogroup" aria-label="LLM provider" className="flex rounded-lg border border-border p-0.5">
              {PROVIDERS.map((p) => (
                <button
                  key={p}
                  role="radio"
                  aria-checked={settings.provider === p}
                  onClick={() => pickProvider(p)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-sm font-medium capitalize transition-colors",
                    settings.provider === p
                      ? "bg-accent text-accent-foreground"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <Note>
              Which LLM writes the answer. Retrieval is identical either way — only
              the wording/quality changes. Groq has a more generous free quota.
            </Note>
          </div>

          {/* Model */}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Model</span>
            <input
              list="sidebar-model-options"
              value={settings.model}
              onChange={(e) => set({ model: e.target.value })}
              placeholder="provider default"
              className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <datalist id="sidebar-model-options">
              {PROVIDER_MODELS[settings.provider].map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <Note>The specific model for the chosen provider (pick from the list or type one).</Note>
          </label>

          {/* Temperature */}
          <label className="block space-y-1.5">
            <span className="flex justify-between text-sm font-medium text-foreground">
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
            <Note>Randomness of wording. Low (0–0.3) = focused & consistent; high = more varied. Keep low for legal answers.</Note>
          </label>

          {/* Max tokens */}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Max tokens</span>
            <input
              type="number"
              min={1}
              value={settings.maxTokens ?? ""}
              onChange={(e) => set({ maxTokens: e.target.value ? Number(e.target.value) : null })}
              placeholder="auto"
              className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <Note>Upper limit on answer length. Leave blank for the model default; set lower to force shorter replies.</Note>
          </label>
        </fieldset>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3">
        <Button
          variant="outline"
          size="md"
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
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="rounded-md bg-user-bubble px-1.5 py-0.5 font-mono text-xs text-foreground">
          {value}
        </span>
      </div>
      {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-relaxed text-muted">{children}</p>;
}
