"use client";

import { Scale, Trash2 } from "lucide-react";
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
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Scale className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="leading-tight">
          <p className="text-base font-semibold tracking-tight">Law Buddy</p>
          <p className="text-sm text-muted">Legal answers, cited</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        {/* Retrieval */}
        <Section title="Retrieval">
          <Row label="Sources to retrieve" value={settings.topK} />
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
          <Hint>Statute sections fed to the model. More = broader & better-cited; fewer = tighter.</Hint>
        </Section>

        {/* Clarification thresholds */}
        <Section title="Clarification" divider>
          <div className="space-y-2">
            <Row label="Clarify floor (hard)" value={settings.clarifyScoreFloor.toFixed(2)} />
            <input
              type="range"
              min={0.7}
              max={0.95}
              step={0.01}
              value={settings.clarifyScoreFloor}
              onChange={(e) => {
                const v = Number(e.target.value);
                set({
                  clarifyScoreFloor: v,
                  lowConfidenceFloor: Math.max(v, settings.lowConfidenceFloor),
                });
              }}
              aria-label="Clarify score floor"
              aria-valuetext={settings.clarifyScoreFloor.toFixed(2)}
              className="w-full accent-accent"
            />
            <Hint>Below this top-match score the answer is replaced by a clarifying question. Lower = answers more; higher = asks more.</Hint>
          </div>

          <div className="space-y-2">
            <Row label="Low-confidence floor (soft)" value={settings.lowConfidenceFloor.toFixed(2)} />
            <input
              type="range"
              min={0.7}
              max={0.95}
              step={0.01}
              value={settings.lowConfidenceFloor}
              onChange={(e) => {
                const v = Number(e.target.value);
                set({
                  lowConfidenceFloor: v,
                  clarifyScoreFloor: Math.min(v, settings.clarifyScoreFloor),
                });
              }}
              aria-label="Low confidence floor"
              aria-valuetext={settings.lowConfidenceFloor.toFixed(2)}
              className="w-full accent-accent"
            />
            <Hint>Between this and the hard floor the model keeps the sources but is nudged to ask if they don&apos;t fit. Kept ≥ hard floor.</Hint>
          </div>
        </Section>

        {/* Model */}
        <Section title="Model" tag="dev only" divider>
          <div className="space-y-2">
            <Label>Provider</Label>
            <div role="radiogroup" aria-label="LLM provider" className="flex rounded-lg border border-border p-1">
              {PROVIDERS.map((p) => (
                <button
                  key={p}
                  role="radio"
                  aria-checked={settings.provider === p}
                  onClick={() => pickProvider(p)}
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors",
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

          <label className="block space-y-2">
            <Label>Model</Label>
            <input
              list="sidebar-model-options"
              value={settings.model}
              onChange={(e) => set({ model: e.target.value })}
              placeholder="provider default"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <datalist id="sidebar-model-options">
              {PROVIDER_MODELS[settings.provider].map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </label>

          <div className="space-y-2">
            <Row label="Temperature" value={settings.temperature.toFixed(1)} />
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
            <Hint>Lower = focused & consistent. Keep low for legal answers.</Hint>
          </div>

          <label className="block space-y-2">
            <Label>Max tokens</Label>
            <input
              type="number"
              min={1}
              value={settings.maxTokens ?? ""}
              onChange={(e) => set({ maxTokens: e.target.value ? Number(e.target.value) : null })}
              placeholder="auto"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <Hint>Caps answer length. Blank = model default.</Hint>
          </label>
        </Section>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-5 py-4">
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

function Section({
  title,
  tag,
  divider,
  children,
}: {
  title: string;
  tag?: string;
  divider?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("py-5", divider && "border-t border-border")}>
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        {title}
        {tag && (
          <span className="rounded bg-user-bubble px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-normal">
            {tag}
          </span>
        )}
      </h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="rounded-md bg-user-bubble px-2 py-0.5 font-mono text-xs text-foreground">
        {value}
      </span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium text-foreground">{children}</span>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-relaxed text-muted">{children}</p>;
}
