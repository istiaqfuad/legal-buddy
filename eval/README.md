# Chunking / retrieval eval harness

Isolated A/B harness used to validate the chunking, retrieval, and embedding-model
choices in the RAG pipeline. **Results and analysis: [`REPORT.md`](REPORT.md).**
Strategy explanation: [`../docs/chunking_and_retrieval.md`](../docs/chunking_and_retrieval.md).

Ingests into throwaway `legal_acts_eval_*` Qdrant collections — never touches the
production collection.

## Files

| file | role |
|---|---|
| `common.py` | env, Qdrant client, embedding model, metrics (recall@k, MRR) |
| `select_subset.py` | pick a deterministic ~200-act subset → `subset_acts.json` |
| `gen_goldset.py` | LLM-generate Q→section gold pairs (Gemini); base prompt + candidate sampler |
| `gen_goldset_groq.py` | expand the gold set via Groq (appends to `goldset.json`) |
| `baseline_chunk.py` | frozen copy of the *old* chunking, so the baseline stays reproducible |
| `ingest_eval.py` | ingest the subset into a collection with `--mode baseline\|improved` |
| `run_eval.py` | score a collection against the gold set → `metrics_<tag>.json` |
| `compare3.py` | side-by-side compare of the recorded metrics |
| `cleanup.py` | drop every `legal_acts_eval_*` collection |

## Run

```bash
PYTHONPATH=eval uv run python eval/select_subset.py
PYTHONPATH=eval uv run python eval/gen_goldset.py        # then gen_goldset_groq.py for more
PYTHONPATH=eval uv run python eval/ingest_eval.py --mode baseline
PYTHONPATH=eval uv run python eval/ingest_eval.py --mode improved
PYTHONPATH=eval uv run python eval/run_eval.py --collection legal_acts_eval_baseline --tag baseline
PYTHONPATH=eval uv run python eval/run_eval.py --collection legal_acts_eval_improved --tag improved
PYTHONPATH=eval uv run python eval/compare3.py
PYTHONPATH=eval uv run python eval/cleanup.py            # when done
```

To test a different embedding model / window, prefix with
`EMBEDDING_MODEL=... EMBEDDING_MAX_TOKENS=...` and use a distinct `--collection`/`--tag`.

`goldset.json` and `metrics_*.json` are the recorded artifacts behind `REPORT.md`.
