# Chunking A/B eval — baseline vs improved (#1–#4)

Branch: `chunking-eval`. All code under `eval/`. Ingestion targets two throwaway
Qdrant collections on the configured remote server (`legal_acts_eval_baseline`,
`legal_acts_eval_improved`); the production collections were never touched.

## Setup

- **Corpus subset**: 201 acts (Penal Code force-included), ~5,357 sections.
  Deterministic stride sample (`eval/select_subset.py`).
- **Gold set**: 26 Q→section pairs, LLM-synthesized with Gemini
  (`gemini-2.5-flash-lite` + other model buckets; `eval/gen_goldset*.py`).
  Gold key = `(act_file, section_ord)` — chunking-independent, so the same set
  scores both collections. Mostly Bengali questions (the corpus is bilingual).
- **Metric**: embed query (`query:` prefix) → top-100 candidate chunks → collapse
  to unique sections (parent-document) → recall@{1,3,5,10} + MRR. Both chunk-level
  and section-level reported; for this data they coincide.
- **Chunk counts**: baseline 6,690 chunks · improved 17,790 chunks.

## Results (n=26)

| metric | baseline | improved | Δ |
|---|---|---|---|
| recall@1  | 0.231 | **0.308** | **+0.077** |
| recall@3  | 0.462 | 0.462 | 0.000 |
| recall@5  | **0.577** | 0.462 | −0.115 |
| recall@10 | **0.654** | 0.577 | −0.077 |
| MRR       | 0.384 | **0.407** | +0.023 |

**Not a clean win.** Improved sharpens the top result (recall@1 +33% relative, MRR
up) but loses recall in the 5–10 band. Per-question (`eval/metrics_*.json`):

- Rescued hard/missed cases: `1394#5` None→1, `934#20` None→2, `1454#3` 21→1,
  `934#25` 79→27.
- Demoted easy cases baseline already had: `829#11` 4→28, `934#19` 9→35,
  `1284#6` 2→11, `882#32` 9→27, `1053#36` 4→17.

At n=26 each delta is 2–3 questions — inside binomial noise (95% CI ≈ ±0.19 at
these rates). **Direction, not proof.**

## The one unambiguous finding: 128-token truncation

The embedding model `triBne-e5-small` has `max_seq_length = 128` tokens (verified:
`SentenceTransformer.max_seq_length` and `tokenizer.model_max_length` both 128).
The baseline ingests 1,200-char chunks (~250–350 tokens) — **the model silently
embeds only the first ~128 tokens of every baseline chunk; ~60% of each chunk's
text never reaches the encoder.** This is a real latent defect in the live
pipeline, independent of the A/B.

Improved fixes it by sizing chunks to the true 128-token window. But doing so
forces heavy fragmentation (17.8k vs 6.7k chunks), and the per-chunk context
header repeated on every ~106-token sliver both helps (rank-1) and hurts
(dilutes short slivers, homogenizes within-act chunks) — which is exactly the
mixed result above.

## What was actually implemented (production `notebooks/ingest_qdrant.py`)

- **#1** `section_title` added to payload + contextual header.
- **#2** token-aware splitting sized to the model's real `max_seq_length` (read at
  runtime), overlap 24 tokens (~20%) vs the old 100 chars (~8%).
- **#3** contextual header (`Act | Title | Section (part k/n)`) on every part.
- **#4** `section_uid` + full `section_full` in payload; `retrieval.py` rewritten
  for parent-document dedupe (return whole sections, top_k unique).

## Verdict & recommendations

1. **Don't ship the bundle as-is** — at this N it's a precision/recall wash, and
   the 128-token cap caps any chunking gain.
2. **Top lever is the model, not the chunker.** The 128-token window is unusually
   small (stock e5-small supports 512). Investigate raising `max_seq_length` to
   512 if the checkpoint supports the positions, or swap to a 512-token e5. That
   likely beats any re-chunking, because it removes the truncation entirely and
   allows whole-section chunks.
3. **Ablate per-feature** — #1/#2/#3/#4 were bundled; the header (#3) is a
   suspect for the recall regression. Test each alone.
4. **Bigger gold set** — 26 is underpowered (Gemini free tier = ~20 req/day/model
   blocked the rest). Need ~150–300 Q for trustworthy deltas; rerun when quota
   resets or with a paid key.

## Reproduce

```bash
PYTHONPATH=eval uv run python eval/select_subset.py
PYTHONPATH=eval uv run python eval/gen_goldset.py          # + gen_goldset_more.py
PYTHONPATH=eval uv run python eval/ingest_eval.py --mode baseline
PYTHONPATH=eval uv run python eval/ingest_eval.py --mode improved
PYTHONPATH=eval uv run python eval/run_eval.py --collection legal_acts_eval_baseline --tag baseline
PYTHONPATH=eval uv run python eval/run_eval.py --collection legal_acts_eval_improved --tag improved
PYTHONPATH=eval uv run python eval/compare.py
```

Cleanup (drops the two remote eval collections): see `eval/cleanup.py`.
