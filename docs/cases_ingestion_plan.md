# Plan: Ingesting `data/cases` (court judgments) into the RAG system

## Context

`data/cases/` holds **8,493 PDF court judgments** (~1.8 GB) from the Supreme Court
of Bangladesh (High Court Division) and lower courts — Civil Revisions, Writ
Petitions, Criminal Appeals, Death References, Tenancy (TN) matters, etc. They are
*precedent / case law*, complementary to the *statutes* already indexed from
`data/acts`. Goal: decide whether they belong in the product, and if so, get them
extracted, structured, embedded, and retrievable alongside the acts.

This plan is grounded in a data analysis (below), not assumptions.

## Data analysis (measured)

| property | finding | implication |
|---|---|---|
| count / size | 8,493 PDFs, 1.8 GB, avg 0.21 MB, 93% < 0.5 MB | manageable; mostly short docs |
| text layer | **~99% born-digital** (pdftotext yields clean text, ~1.5–3k chars/page) | OCR is the *exception* |
| scanned | ~1–3% are image-only (e.g. `303612_Crl_Appl_248_2011.pdf`: 32 pages / 32 chars) | OCR fallback only |
| Bangla | ~2.5% of files carry meaningful Bengali; **pdftotext garbles it** (broken conjuncts/spacing: `গভীর স ে মৎ`) | needs a Bengali-aware path |
| structure | very consistent header: District, Court, Division, Jurisdiction, `Present:` judge, `<Case Type> No. N of YYYY`, `With` (linked cases), Petitioner `-Versus-` Opposite Party, advocates, `Heard on:`, `Judgment on:`, body after `<Judge>, J:` | rich metadata is regex-extractable |
| filenames | encode case type + number + year + party + status (`_SUMMARILY_REJECTED`, `_RS_FIX`) | metadata cross-check |
| outliers | one 11,407-page mega-PDF (`769454_DeathRef58of2013_1.pdf`, 56 MB); multi-part `_1/_2` bundles | cap pages, merge parts |
| tooling | `pdftotext pdfinfo pdfimages tesseract ocrmypdf gs` present; **`tesseract` has only `eng`, no `ben`** | install `tesseract-ocr-ben` |
| existing code | none — greenfield | mirror the acts pipeline |

## Are cases necessary? — Yes, but scoped. And NOT a finetune target.

**Keep them, as a separate corpus.** Acts say *what the law is*; cases show *how
courts apply it* — precedent retrieval ("has this been decided?", "how have courts
ruled on X?", "find similar facts"). That is genuinely additive to a legal
assistant and not derivable from statutes alone.

**Do NOT replace retrieval with fine-tuning.** Fine-tuning bakes *style/format*,
not *factual recall* of 8,493 specific holdings — a fine-tuned model would
hallucinate case numbers and holdings and cannot cite sources. For factual,
citeable case lookup, **RAG is the correct tool**. Fine-tuning has a *narrow*
optional role (see §7), not as a substitute.

**Scope discipline:** ingest a high-value subset first (reported / recent /
non-rejected judgments), prove value, then scale — do not blindly embed all 8,493
on day one (scale note in §6).

---

## Pipeline (mirrors `notebooks/ingest_qdrant.py`, reuses the e5-base + parent-doc work)

### 1. Extraction — hybrid: fast text path + Docling (GPU) for the hard tail
Two tiers, routed by a cheap probe (chars-per-page + Bengali-garble heuristic):

- **Tier 1 — fast path (~95%+, local CPU):** `pdftotext`/`pymupdf` for clean
  born-digital **English** PDFs. Instant, no models. Normalize to Unicode **NFC**.
- **Tier 2 — Docling (the right tool for the hard tail, run on the Fedora GPU):**
  the scanned ~1–3% **and** Bengali-bearing files whose text layer is garbled.
  Docling does layout-aware PDF→Markdown/JSON (reading order, headings, **tables**
  in cause-lists/schedules) and bundles OCR. Config that fits this corpus:
  - `PdfPipelineOptions(do_ocr=True, do_table_structure=True)`
  - `EasyOcrOptions(lang=["en","bn"], force_full_page_ocr=True, use_gpu=True)` —
    EasyOCR covers **Bengali natively**, fixing the garbled-conjunct problem by
    re-OCRing the bitmap instead of trusting the broken text layer (no
    `tesseract-ocr-ben` needed; Tesseract/RapidOCR are alternative backends).
  - `AcceleratorOptions(device=AcceleratorDevice.CUDA)` → runs on the RTX 2070 S.

  Why hybrid, not all-Docling: Docling runs ML layout+OCR per page (slow,
  GPU-bound). Restricting it to the ~5% that need it keeps cost sane while getting
  its quality where layouts are messy/scanned/Bengali. (All-Docling is viable if
  GPU time is cheap — simpler, uniform Markdown + `HybridChunker`, but much slower.)
- **Outliers:** skip/triage over a page cap (e.g. > 200 pages — catches the
  11,407-page mega-PDF); merge `<id>_1/_2` multipart files by base id; log all drops.

### 2. Structuring — header parser → one JSON per case
- Regex/anchor parser over the consistent header to emit a record like
  `data/acts/*.json` but for cases:
  `{ case_id, source_file, court, division, jurisdiction, district, judge(s),
     case_type, case_no, case_year, linked_cases[], petitioners[], respondents[],
     advocates[], heard_dates[], judgment_date, disposition, body_text }`.
- `case_type`/`case_no`/`year`/`status` cross-checked against the filename.
- `disposition` from filename suffixes (`SUMMARILY_REJECTED`, etc.) + body cues
  (allowed/dismissed/disposed of).
- Write to `data/cases_json/<case_id>.json` (intermediate, reviewable, re-runnable).

### 3. Chunking — reuse the improved token-aware chunker
- Reuse `improved_section_records` logic from `notebooks/ingest_qdrant.py`
  (token-aware, sized to the model window, contextual header per chunk).
- Judgments are long prose, not sectioned like statutes → split on paragraphs /
  page boundaries into ~model-window chunks with overlap.
- Prepend a **case header** to every chunk (`Case: <type> No N of YYYY | Court |
  Parties`) — the cross-document analogue of the act/section header.
- Add a **synthetic summary chunk** per case (LLM 2–3 line holding summary) for
  high-recall "what did this case decide" queries. `section_full` = the whole case
  (or whole reasoning section) for parent-document retrieval.

### 4. Embedding + storage — separate collection
- Same model as acts: **`intfloat/multilingual-e5-base`** (768-dim, 512-tok,
  handles Bengali), `passage:`/`query:` prefixes. Reuse `embed_passages`.
- **New Qdrant collection `legal_cases`** (cosine, 768-dim) — keep cases separate
  from `legal_acts_event_rag_full` so retrieval can weight/route them differently.
- Payload: all metadata from §2 + `case_uid` (parent-doc dedupe), `chunk_part`,
  `section_full`. Payload indexes on `case_type`, `case_year`, `court`,
  `disposition`, `case_uid`.

### 5. Retrieval integration — `apps/api/src/api/agents/legal_chat/retrieval.py`
- Add a parallel `retrieve_cases()` querying `legal_cases` with the same
  parent-document dedupe as `_hits_to_sources`.
- Either (a) **dual-retrieve** acts + cases and merge, tagging each `SourceItem`
  with `source_type` (`statute` | `precedent`), or (b) a light **router** (LLM/rules)
  that decides statute-only vs precedent vs both from the question.
- Update `build_grounded_prompt` so the model distinguishes binding statute text
  from persuasive/precedent case holdings, and cites case numbers.

---

## 6. Scale & cost (the real risk)

8,493 judgments × ~6 pages × ~3 chunks/page ≈ **150k–250k chunks** — 4–6× the acts
corpus (40k). CPU embedding at the observed e5-base rate is likely **several hours
to a day**. Mitigations, in order:
1. **Subset first** — reported/recent/non-rejected (cuts volume a lot), prove value.
2. **GPU or managed embeddings** for the full run (batch job).
3. **Blue/green collection** (`legal_cases_v2` → flip) so re-ingest never drops a
   live collection (the outage pattern noted in `eval/REPORT.md`).

Extraction itself is cheap (pdftotext/pymupdf on 99% text PDFs = minutes–an hour);
OCR on the scanned ~1–3% is the slow extraction tail.

## 7. Fine-tuning — the narrow, optional role (not a data store)

Cases can *generate training data*, but for **style/format, not facts**:
- Build instruction pairs (question → grounded answer-with-citation) from
  case+holding to fine-tune **answer style** (tone, structure, citation format).
- Or train a **small Bengali-aware extraction/rerank model**. A cross-encoder
  **reranker** over retrieved cases is higher ROI than generator fine-tuning.
- Keep facts in the vector store; never rely on a fine-tuned model to recall a
  specific case number or holding.

---

## Verification

1. **Extraction QA**: run on a 200-file stratified sample (text / scanned / Bangla);
   assert chars-per-page, Bengali NFC validity, and metadata-parse success rate
   (target > 95% header fields on born-digital English).
2. **Retrieval eval**: reuse the `eval/` harness pattern — generate ~100 Q→case
   gold pairs (Groq/Gemini), ingest the subset into a throwaway `legal_cases_eval`
   collection, measure recall@k / MRR, then clean up (`eval/cleanup.py` pattern).
3. **End-to-end**: a precedent question through `/rag/legal/chat` returns case
   sources with correct case numbers + a holding-grounded answer; a pure-statute
   question still returns acts (router/merge sanity).
4. **Bengali spot-check**: confirm a known Bengali judgment is extracted cleanly
   (NFC, no broken conjuncts) and retrievable by a Bengali query.

## Suggested phasing
1. Extraction + structuring → `data/cases_json/` (incl. OCR fallback, `ben` install).
2. Eval harness + ~100 gold pairs on a subset → measure before full ingest.
3. Subset ingest into `legal_cases`, wire `retrieve_cases()` + dual-retrieve.
4. Scale to full corpus (GPU/managed embeddings, blue/green) once the subset proves out.
5. Optional: reranker; optional: style fine-tune from case Q→A pairs.

## New deps / system
- `uv add pymupdf` (fast-path extraction); reuse `sentence-transformers`, `qdrant-client`.
- `uv add docling` for the hard tail (scanned + garbled-Bengali) — bundles EasyOCR
  (Bengali) and runs on the **Fedora RTX 2070 S** via `AcceleratorDevice.CUDA`.
  Optionally `docling-core`'s `HybridChunker` for structure-aware case chunking.
- Fedora is bare (Python 3.14, no torch/uv): install `uv`, pin **Python ≤ 3.13**
  for the embed/Docling env (no torch wheels for 3.14), then `torch` (CUDA) +
  `docling` + `sentence-transformers`.
- `tesseract-ocr-ben` only if using the Tesseract backend instead of EasyOCR.
