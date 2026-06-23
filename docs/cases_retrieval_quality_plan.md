# Cases Phase-2 plan — quality layers, reprioritized for the Gemini free tier

This plan covers the work **after** Phase 1 (precedent dual-retrieve, done). It
reorders the quality backlog around one hard constraint: the project runs on the
**Gemini free API tier** (low requests-per-minute + daily quota). The governing
rule is therefore:

> **Prefer levers that cost nothing per user query** — one-time batch jobs and
> local models — over anything that adds an LLM call to the request path.

That single rule demotes HyDE and promotes summary cards + a local reranker.

Related docs: [`situational_rag_plan.md`](situational_rag_plan.md) (this plan
supersedes its build ordering), [`cases_ingestion_plan.md`](cases_ingestion_plan.md),
[`chunking_and_retrieval.md`](chunking_and_retrieval.md).

---

## Status (Phase 1 — done)

- `legal_cases` is populated (~79k points / ~8k cases). English chunks clean;
  ~1,417 Bengali/legacy-font cases are garbled mojibake in the collection (OCR
  tail — see (f)). Phase 0 (chunk+embed) is therefore already satisfied; **do not
  re-run `cases-ingest`** (it recreates the collection).
- Precedent retrieval is wired into the live RAG (`apps/api/src/api/agents/legal_chat/`):
  - `retrieval.py` — `retrieve_cases()` (Qdrant `query_points_groups` on
    `case_uid` → top_k distinct cases) + `retrieve_all_sources()` (embed once,
    query both collections, drop sub-floor, renumber).
  - `api/api/models.py` — `SourceItem` += `source_type` + case fields.
  - `core/config.py` — `CASES_COLLECTION`, `CASES_TOP_K`, `CASE_SCORE_FLOOR=0.82`,
    `STATUTE_SCORE_FLOOR=0.0`.
  - `prompting.py` — statute (binding) vs precedent (persuasive) blocks + no-
    precedent rule + disclaimer.
  - `pipeline.py` — uses `retrieve_all_sources`.
- Verified end-to-end: a dowry scenario's statute side missed the governing law
  (vocabulary gap), but the precedents supplied Nari-O-Shishu / Dowry Act and the
  answer cited them.

---

## Constraint: the Gemini free tier

- The user-facing **answer generation** is the one LLM call we must always spend
  per query — reserve the Gemini free quota for it.
- Any feature that adds a **second per-query LLM call** (e.g. HyDE) roughly halves
  throughput and invites HTTP 429s. Avoid on the free tier.
- Both `GEMINI_API_KEY` and `GROQ_API_KEY` exist (`.env.example`). Groq's free tier
  has higher RPM, so route **non-user-facing / bulk** LLM work to Groq and keep
  Gemini for the answer.
- Local models (cross-encoder reranker, embeddings) cost **no API quota at all** —
  these are the safest quality levers here.

---

## Reprioritized Phase-2 backlog (free-tier ROI order)

### (a) Summary cards — DO FIRST
Highest scenario-matching ROI and **zero per-query cost** (a one-time batch, not a
request-path call).

- New `apps/ingestion/src/ingestion/cases_summarize.py` →
  `summarize_case(rec, llm)` writes a structured headnote
  (`summary_card` + `card_issue`, `card_holding`, `statutes_cited`) into each
  `data/cases_json/<id>.json`. Reuse the `instructor` structured-output stack from
  `apps/api/.../legal_chat/generation.py`. Truncate oversized bodies before the
  call (matters for the ~13MB outlier; `disposition` is null ~33% so do not rely
  on it alone).
- Cache-in-JSON + **resumable** (skip files that already have `summary_card`) so
  the ~8k calls can dribble through the Gemini free quota over days, **or** run
  faster on Groq. The chunker stays LLM-free and deterministic.
- `apps/ingestion/src/ingestion/cases_chunking.py` `case_records`: add `chunk_kind`
  to `base_payload` (default `"body"`); prepend a `chunk_kind="summary"` record
  built from `rec["summary_card"]` when present (`chunk_part=0`).
- Re-embed via the existing append path `CASES_INGEST_FILES` (idempotent per
  `case_uid`) — **never recreate** the collection. The same pass later absorbs the
  OCR'd Bengali tail (f).
- `retrieval.py` `_case_groups_to_sources`: prefer the `chunk_kind="summary"`
  chunk for the excerpt / boost summary-card hits.

### (b) Cross-encoder rerank — DO SECOND
**Local model, no API** → ideal for the free tier, and the robust fix for the thin
`CASE_SCORE_FLOOR=0.82` margin (bi-encoder cosine barely separates on-topic ~0.83
from off-topic ~0.80).

- New `apps/api/src/api/agents/legal_chat/rerank.py` → `rerank(question, sources)`
  using a local cross-encoder (e.g. `BAAI/bge-reranker-v2-m3`, multilingual, or
  `cross-encoder/ms-marco-MiniLM-L-6-v2` for English-only). Load via
  sentence-transformers `CrossEncoder`, CPU is fine for a top-N pool.
- Rerank the merged statute+precedent pool from `retrieve_all_sources`; config-
  flagged; insert in `pipeline.py` between retrieve and `build_grounded_prompt`.
- Use the cross-encoder score for abstention (a calibrated relevance signal, far
  better than the raw cosine floor).

### (c) Abstention + floor tuning — no API
- Tune `CASE_SCORE_FLOOR` against real score distributions; consider a small
  `STATUTE_SCORE_FLOOR` to drop the junk acts that lay queries surface.
- Extend the empty-sources branch in `pipeline.py` to also abstain when the best
  (post-rerank) score is below floor — return "insufficient sources / consult a
  lawyer" rather than a confident wrong answer.

### (d) HyDE — DEFERRED (free-tier reason)
HyDE rewrites the lay query into a hypothetical holding/statute paragraph before
retrieval. It is the biggest *query-side* lever for the statute vocabulary gap —
**but it adds a second LLM call per query**, which the Gemini free tier cannot
sustain. Deferred. Fallbacks if/when needed:

- **Groq-only rewrite:** run the cheap HyDE rewrite on Groq (higher free RPM),
  keep Gemini for the answer — one Gemini call per query preserved.
- **Non-LLM query expansion:** a static legal synonym/keyword map (lay term →
  statutory term, e.g. "thrown out" → "ejectment / notice to quit") expands the
  query with **zero API cost**. Lower ceiling than LLM HyDE but free.
- Revisit full HyDE only on a paid/raised tier.

Note: summary cards (a) already close much of the gap from the *corpus* side, so
HyDE's marginal value drops once cards land.

### (e) Eval harness — mostly no API
- `eval/`: gold scenario→{section, case} pairs; report recall@k / MRR (no API).
- Add the 5 intrinsic chunking metrics from arXiv 2603.25333 (Size Compliance,
  Intrachunk Cohesion, Doc Contextual Coherence, Block Integrity, Filtered
  Missing-Reference) — no gold labels, no API — to compare summary-card vs body-
  chunk segmentation before committing the re-embed.

### (f) OCR Bengali tail — GPU, not LLM
- Re-OCR the ~1,417 garbled/legacy-font cases (`cases-build` with
  `CASES_HYBRID_RESUME=1` on the GPU box), then append via `CASES_INGEST_FILES`
  (replaces the mojibake points). No LLM quota involved; blocked only on GPU
  availability.

---

## Provider-routing guidance

| Step | Engine | Cost shape |
|---|---|---|
| (a) Summary cards | Groq (fast) or Gemini (slow, resumable) | one-time batch |
| (b) Cross-encoder rerank | local CrossEncoder (CPU) | none (per query, local) |
| (c) Abstention / floor | none | none |
| (d) HyDE *(deferred)* | Groq rewrite, or non-LLM map | per query (avoid on Gemini free) |
| (e) Eval | local (intrinsic metrics) | none |
| (f) OCR tail | GPU (EasyOCR) | none (GPU) |
| **User answer** | **Gemini** (reserved) | **per query** |

Rule of thumb: **Gemini = the answer only. Everything auxiliary goes to Groq,
local, or GPU.**

---

## Suggested order

1. (a) summary cards → biggest quality jump, no per-query cost.
2. (b) local reranker → precision + real abstention.
3. (c) floor/abstention tuning on top of the reranker.
4. (e) eval to quantify (a)/(b).
5. (f) OCR tail when the GPU frees.
6. (d) HyDE only if the API tier is upgraded (or via the Groq/non-LLM fallback).
