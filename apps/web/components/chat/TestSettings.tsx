"use client";

import { FlaskConical } from "lucide-react";
import {
  type ChatSettings,
  type Provider,
  PROVIDER_MODELS,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const PROVIDERS: Provider[] = ["gemini", "groq"];

export function TestSettings({
  settings,
  onChange,
}: {
  settings: ChatSettings;
  onChange: (next: ChatSettings) => void;
}) {
  const set = (patch: Partial<ChatSettings>) => onChange({ ...settings, ...patch });

  const pickProvider = (provider: Provider) =>
    set({ provider, model: PROVIDER_MODELS[provider][0] });

  return (
    <div className="mb-2 rounded-xl border border-dashed border-border bg-surface/60 p-3 text-sm">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
        <FlaskConical className="h-3.5 w-3.5" />
        Test settings <span className="font-normal">(dev only)</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Provider */}
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Provider</span>
          <div className="flex rounded-lg border border-border p-0.5">
            {PROVIDERS.map((p) => (
              <button
                key={p}
                onClick={() => pickProvider(p)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors",
                  settings.provider === p
                    ? "bg-accent text-accent-foreground"
                    : "text-muted hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </label>

        {/* Model */}
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Model</span>
          <input
            list="model-options"
            value={settings.model}
            onChange={(e) => set({ model: e.target.value })}
            placeholder="default"
            className="h-7 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
          />
          <datalist id="model-options">
            {PROVIDER_MODELS[settings.provider].map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </label>

        {/* Temperature */}
        <label className="flex flex-col gap-1">
          <span className="flex justify-between text-xs text-muted">
            <span>Temperature</span>
            <span className="font-mono text-foreground">{settings.temperature.toFixed(1)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={settings.temperature}
            onChange={(e) => set({ temperature: Number(e.target.value) })}
            className="accent-accent"
          />
        </label>

        {/* Max tokens */}
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Max tokens</span>
          <input
            type="number"
            min={1}
            value={settings.maxTokens ?? ""}
            onChange={(e) =>
              set({ maxTokens: e.target.value ? Number(e.target.value) : null })
            }
            placeholder="auto"
            className="h-7 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>
    </div>
  );
}
