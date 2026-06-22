# Plan: Situational legal RAG — answer a user's real situation with statute + precedent

## The core reframe: retrieve, don't "learn"

The model does **not** learn the judgments/statutes by training on them. Training
(fine-tuning) bakes *style and format*, not *factual recall* — a fine-tuned model
invents case numbers and section text and cannot cite a source. Every fact and
citation in an answer must come from the **vector store at query time (RAG)**.
"Make the AI learn from the cases" therefore means: make the corpus retrievable,
and make the model reason over what is retrieved. Fine-tuning has only a narrow,
optional role (style / issue-spotting / reranking — see §6).

## What exists today (statute-only, single hop)

`apps/api/src/api/agents/legal_chat/`:

- `pipeline.py` — `legal_chat_pipeline(question)` → `retrieve_sources` →
  `build_grounded_prompt` → `run_llm` → `LegalChatResponse`.
- `retrieval.py` — embeds the **raw question** (e5), queries one collection
  (`config.QDRANT_COLLECTION` = acts), `_hits_to_sources` collapses chunks to
  unique sections by `section_uid` (parent-document retrieval).
- `prompting.py` — `build_grounded_prompt`: statute-only system prompt, cite
  `[Source N]`.

### Why it cannot yet handle a *situational* question
1. **Vocabulary gap.** It embeds the user's lay narrative directly. "My landlord
   evicted me without notice" shares almost no tokens with statutory language
   ("ejectment", "notice to quit", "section 106") → weak or empty retrieval.
2. **Statute only.** No precedent corpus in the loop. `_hits_to_sources` is
   hard-keyed to acts payload (`section_uid`, `act_title`); cases use
   `case_uid` / `full_case_ref` and need a parallel path.
3. **No issue-spotting, no rerank, no binding-vs-persuasive distinction.**

## Target pipeline (extend, don't replace)

```
question
  └─ Stage 0  Situation understanding (LLM)  -> issues, domain, relief, expanded queries (HyDE)
  └─ Stage 1  Dual retrieve                  -> legal_acts + legal_cases, tagged source_type
  └─ Stage 2  Rerank (cross-encoder)         -> best statute + precedent for THIS situation
  └─ Stage 3  Grounded generation            -> binding statute + persuasive precedent, cited
  └─ Stage 4  Guardrails                      -> abstain on low score, disclaimer, scope
```

### Stage 0 — Situation understanding (new; biggest quality lever)
An LLM pre-pass converts the messy narrative into structure **and better search
queries**:

```
user: "landlord threw me out, no notice, rent was paid"
  -> issues:  [unlawful eviction, tenancy notice]
  -> domain:  tenancy / property      relief: restoration, damages
  -> queries (legal vocabulary + HyDE):
       "ejectment of tenant without statutory notice to quit"
       "tenant's right to restoration of possession Bangladesh"
```

HyDE (Hypothetical Document Embeddings): have the LLM draft a *hypothetical
statute paragraph / how a court would frame it*, and embed **that** instead of
the lay text. This is what closes the vocabulary gap.

- New module `query_understanding.py`; runs before retrieval.
- Output is structured (reuse the project's structured-output approach).

### Stage 1 — Dual retrieve (extend `retrieval.py`)
- Embed the expanded query; query **`legal_acts` AND `legal_cases`** in parallel.
- Tag every `SourceItem` with `source_type` = `statute | precedent`.
- Parent-document dedupe **per corpus**: acts by `section_uid`, cases by
  `case_uid`. Add `retrieve_cases()` mirroring `_hits_to_sources` against the
  cases payload (`full_case_ref`, `division`, `disposition`, `section_full`).
- Optional payload filters from Stage 0: cases by `case_type` / `case_year`,
  acts by domain. (Indexes already built on both collections.)
- Either merge both result sets, or add a light **router** (rules/LLM) that
  decides statute-only vs precedent vs both from the question.

### Stage 2 — Rerank (new; high ROI)
Cross-encoder reranks the merged statute+precedent pool against the user's actual
situation text. Higher ROI than generator fine-tuning (cf. cases plan §7). New
`rerank.py`; gate behind a config flag so it can be A/B'd.

### Stage 3 — Grounded generation (extend `prompting.py`)
Prompt must separate **binding statute** from **persuasive precedent** and shape
the answer:
1. The situation, restated in legal terms.
2. Governing **statute + section number** (binding).
3. How courts have applied it — **case number + holding** (persuasive precedent).
4. Practical steps / relief available.
5. Caveats + "this is general information, not legal advice; consult a lawyer."

Cite section numbers **and** case numbers, only from retrieved sources. Keep the
existing "synthesize across ALL relevant sources / do not fabricate" discipline.

### Stage 4 — Guardrails (extend `pipeline.py`)
- Jurisdiction = Bangladesh; flag when a question is outside the corpus.
- **Abstain when the top retrieval score is low** — return "insufficient
  sources" rather than a confident wrong answer (the empty-sources branch in
  `pipeline.py` is the seed of this; extend to a score threshold).
- Standard legal disclaimer on every answer.

## File-by-file change map

| stage | file | change |
|---|---|---|
| 0 | `query_understanding.py` (new) | LLM issue-spot + HyDE query expansion |
| 1 | `retrieval.py` | `retrieve_cases()`, dual-retrieve + merge/router, `source_type` |
| 1 | `api/api/models.py` | add `source_type` (and case fields) to `SourceItem` |
| 2 | `rerank.py` (new) | cross-encoder rerank, config-flagged |
| 3 | `prompting.py` | statute-vs-precedent prompt, cite case numbers |
| 4 | `pipeline.py` | score-threshold abstention, disclaimer, wire stages |

## Suggested build order
1. **Stage 1 dual-retrieve** — smallest change; precedent immediately shows up in
   answers alongside statutes. (Depends on `legal_cases` being populated.)
2. **Stage 0 situation understanding** — biggest jump for lay/situational questions.
3. **Stage 3 prompt** — make answers cite cases + separate binding/persuasive.
4. **Stage 2 rerank** + **Stage 4 guardrails** — precision + safety.
5. Eval at each step (reuse `eval/`: gold Q→{section, case} pairs, recall@k / MRR,
   plus a small situational-question set graded for correct statute + case).

## §6 Fine-tuning — the narrow role (not a fact store)
- Style / structure / citation format, or an **issue-spotting** model, trained on
  case Q→A pairs.
- A **cross-encoder reranker** is the highest-ROI training target.
- Never rely on a fine-tuned model to recall a specific section or holding — facts
  stay in Qdrant.

## Prerequisite (in progress)
Both corpora populated in Qdrant: `legal_acts_event_rag_full` (done) and
`legal_cases` (cases — see `docs/cases_ingestion_plan.md`; full clean-corpus embed
in progress, 444-file Docling hard tail pending).
