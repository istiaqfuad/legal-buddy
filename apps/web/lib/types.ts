// Mirrors the FastAPI response (apps/api/src/api/api/models.py)
export interface Source {
  citation_id: number;
  act_title: string | null;
  act_year: number | null;
  section_index: string | null;
  source_url: string | null;
  excerpt: string;
  score: number;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
}

// --- Testing knobs (dev-only; remove with the UI controls before production) ---
export type Provider = "gemini" | "groq";

export interface ChatSettings {
  provider: Provider;
  model: string; // "" => let the API pick the provider default
  temperature: number;
  maxTokens: number | null;
  topK: number;
}

export const PROVIDER_MODELS: Record<Provider, string[]> = {
  gemini: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "openai/gpt-oss-120b"],
};

export const DEFAULT_SETTINGS: ChatSettings = {
  provider: "groq",
  model: "llama-3.3-70b-versatile",
  temperature: 0.2,
  maxTokens: null,
  topK: 6,
};

export type Role = "user" | "assistant";

export interface Turn {
  id: string;
  role: Role;
  content: string;
  sources?: Source[];
  error?: boolean;
}
