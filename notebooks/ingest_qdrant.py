"""Ingest Bangladesh legal acts into Qdrant using a HuggingFace sentence-transformers
embedding model (run locally on CPU).

Run from the repo root:

    uv run python notebooks/ingest_qdrant.py

Reads configuration from the project ``.env``:
    QDRANT_VECTORESTORE, QDRANT_API_KEY, QDRANT_COLLECTION,
    EMBEDDING_MODEL (HuggingFace id), HF_TOKEN
"""

import json
import os
import re
import time
import uuid
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.http import models
from sentence_transformers import SentenceTransformer

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

QDRANT_URL = os.getenv("QDRANT_VECTORESTORE", "http://213.136.80.53:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY") or None
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "legal_acts_event_rag_full")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL")
HF_TOKEN = os.getenv("HF_TOKEN") or None
ACTS_DIR = ROOT / "data" / "acts"

UPSERT_BATCH_SIZE = 64
ENCODE_BATCH_SIZE = 32

# Token-aware chunking budget. The chunk is sized to the embedding model's REAL
# max_seq_length (read at runtime) so the whole chunk is actually embedded. This
# model truncates at 128 tokens, so the old 1200-char chunks (~250-350 tokens) had
# ~60% of their text silently dropped at embed time; sizing to the true window
# fixes that. Header + "passage:" prefix are reserved out of the budget.
TOKEN_OVERLAP = 24  # ~20% of a 128-token window; old 100 chars was ~8%


def _model_max_tokens(model) -> int:
    return int(getattr(model, "max_seq_length", 0) or 128)

if not EMBEDDING_MODEL:
    raise ValueError("EMBEDDING_MODEL is required in .env")

# e5-family models are asymmetric: passages get a "passage:" prefix at ingestion,
# queries get a "query:" prefix at search time (handled in the API embedding module).
_IS_E5 = "e5" in EMBEDDING_MODEL.lower()


def passage_text(text: str) -> str:
    return f"passage: {text}" if _IS_E5 else text


SECTION_INDEX_RE = re.compile(
    r"^[\s\"'\[\]]*\[?([0-9০-৯]+[a-zA-Z]*)[.।৷\-\s]"
)
FOOTNOTE_MARKER_RE = re.compile(r"\d+\[(.*?)\]")
VOID_SECTION_RE = re.compile(
    r"\[\s*(Omitted|Repealed?|Rep\.)\s+by" r"|\[\s*Repeal\.\-" r"|\[\s*Omit\.\-",
    re.IGNORECASE,
)
SUBSECTION_SPLIT_RE = re.compile(r"(?=(?:\(\d+\)|\([a-zA-Z]+\)))")


def extract_section_index(section_content: str) -> str:
    if not section_content:
        return "Unknown"
    match = SECTION_INDEX_RE.search(section_content)
    return (match.group(1).strip() if match else "Unknown") or "Unknown"


def clean_section_content(section_content: str) -> str:
    if not section_content:
        return ""
    return FOOTNOTE_MARKER_RE.sub(r"\1", section_content).strip()


# ---- #2 token-aware splitting -------------------------------------------------

def _token_len(model, text: str) -> int:
    return len(model.tokenizer.encode(text, add_special_tokens=False))


def _token_slice(model, text: str, budget: int, overlap: int) -> list[str]:
    """Slice a too-long string into <=budget-token windows with token overlap."""
    ids = model.tokenizer.encode(text, add_special_tokens=False)
    if len(ids) <= budget:
        return [text.strip()] if text.strip() else []
    out, start = [], 0
    stride = max(1, budget - overlap)
    while start < len(ids):
        window = ids[start : start + budget]
        piece = model.tokenizer.decode(window).strip()
        if piece:
            out.append(piece)
        if start + budget >= len(ids):
            break
        start += stride
    return out


def chunk_section_tokens(model, text: str, budget: int, overlap: int) -> list[str]:
    """Split-then-merge on subsection boundaries, measured in tokens."""
    if not text:
        return []
    if _token_len(model, text) <= budget:
        return [text]
    parts = [p.strip() for p in SUBSECTION_SPLIT_RE.split(text) if p.strip()]
    if len(parts) > 1:
        merged, current = [], ""
        for part in parts:
            candidate = f"{current} {part}".strip() if current else part
            if _token_len(model, candidate) <= budget:
                current = candidate
                continue
            if current:
                merged.append(current)
                current = ""
            if _token_len(model, part) <= budget:
                current = part
                continue
            merged.extend(_token_slice(model, part, budget, overlap))
        if current:
            merged.append(current)
        if merged:
            return merged
    return _token_slice(model, text, budget, overlap)


# ---- #1 + #3 contextual header ------------------------------------------------

def context_header(act_title: str, section_title: str | None, section_index: str) -> str:
    bits = [f"Act: {act_title}"]
    if section_title:
        bits.append(f"Title: {section_title}")
    bits.append(f"Section {section_index}")
    return " | ".join(bits)


def build_embedding_text(header: str, part_no: int, n_parts: int, chunk_text: str) -> str:
    # #3: every part carries the act/title/section header, so split parts 2..n keep
    # their context instead of being a headless tail.
    cont = f" (part {part_no}/{n_parts})" if n_parts > 1 else ""
    return f"{header}{cont}\n{chunk_text}"


def improved_section_records(act_obj: dict, section: dict, model) -> list[dict]:
    """Yield improved records for one section: {embedding_text, payload_extra}.

    Implements #1 (section_title in payload + embed text), #2 (token-aware cap +
    larger overlap), #3 (contextual header on every part), and #4 (section_full +
    section_uid carried in payload so retrieval can return the whole section).
    Returns [] for void/empty sections.
    """
    raw_content = (section or {}).get("section_content", "")
    if VOID_SECTION_RE.search(raw_content or ""):
        return []
    cleaned = clean_section_content(raw_content)
    if not cleaned:
        return []

    section_title = (section or {}).get("section_title")
    section_index = extract_section_index(cleaned)
    act_title = act_obj.get("act_title", "Unknown Act")
    header = context_header(act_title, section_title, section_index)

    # Reserve tokens for the header + "passage:" prefix so the whole chunk fits the
    # model's real embedding window (no silent truncation).
    max_tokens = _model_max_tokens(model)
    # +12 covers the "passage:" prefix, the "(part k/n)" marker, and the newline
    # that sit alongside the header but aren't in `header` itself.
    reserved = _token_len(model, passage_text(header)) + 12
    budget = max(32, min(max_tokens - reserved, max_tokens - 4))
    overlap = min(TOKEN_OVERLAP, max(4, budget // 4))

    parts = chunk_section_tokens(model, cleaned, budget, overlap)
    n_parts = len(parts)
    records = []
    for part_no, chunk_text in enumerate(parts, start=1):
        records.append(
            {
                "embedding_text": build_embedding_text(header, part_no, n_parts, chunk_text),
                "payload_extra": {
                    "section_title": section_title,
                    "section_index": section_index,
                    "chunk_part": part_no,
                    "n_parts": n_parts,
                    "section_content_clean": chunk_text,
                    "section_full": cleaned,  # #4 parent-document text
                },
            }
        )
    return records


def collect_all_records(acts_dir: Path, model) -> tuple[list[dict], dict]:
    records = []
    stats = {
        "files_seen": 0,
        "acts_skipped_repealed": 0,
        "acts_skipped_no_sections": 0,
        "sections_seen": 0,
        "sections_skipped_void_or_empty": 0,
        "chunks_created": 0,
    }

    for file_path in sorted(acts_dir.glob("act-print-*.json")):
        stats["files_seen"] += 1
        with open(file_path, "r", encoding="utf-8") as f:
            act_obj = json.load(f)

        if act_obj.get("csv_metadata", {}).get("is_repealed") is True:
            stats["acts_skipped_repealed"] += 1
            continue

        sections = act_obj.get("sections") or []
        if not sections:
            stats["acts_skipped_no_sections"] += 1
            continue

        for section_ord, section in enumerate(sections):
            stats["sections_seen"] += 1
            recs = improved_section_records(act_obj, section, model)
            if not recs:
                stats["sections_skipped_void_or_empty"] += 1
                continue
            for rec in recs:
                payload = {
                    "act_file": file_path.stem,
                    "section_ord": section_ord,
                    "section_uid": f"{file_path.stem}#{section_ord}",  # #4
                    "act_title": act_obj.get("act_title"),
                    "act_no": act_obj.get("act_no"),
                    "act_year": (
                        int(act_obj["act_year"])
                        if str(act_obj.get("act_year", "")).isdigit()
                        else None
                    ),
                    "language": act_obj.get("language"),
                    "govt_system": act_obj.get("government_context", {}).get("govt_system"),
                    "source_url": act_obj.get("source_url"),
                    **rec["payload_extra"],
                }
                records.append({"embedding_text": rec["embedding_text"], "payload": payload})

    stats["chunks_created"] = len(records)
    return records, stats


def build_qdrant_client() -> QdrantClient:
    parsed = urlparse(QDRANT_URL)
    kwargs: dict = {"url": QDRANT_URL, "api_key": QDRANT_API_KEY, "timeout": 300}
    # qdrant-client defaults to port 6333 when the URL omits a port; an https
    # endpoint behind a reverse proxy (e.g. Cloudflare) is served on 443.
    if parsed.scheme == "https" and parsed.port is None:
        kwargs["port"] = 443
    return QdrantClient(**kwargs)


def upsert_with_retry(
    client: QdrantClient,
    collection_name: str,
    points: list,
    attempts: int = 4,
) -> None:
    for attempt in range(1, attempts + 1):
        try:
            client.upsert(collection_name=collection_name, points=points, wait=True)
            return
        except Exception as exc:  # transient network/proxy timeouts
            if attempt == attempts:
                raise
            backoff = 2 * attempt
            print(f"[ingest] upsert retry {attempt}/{attempts} after error: {exc}")
            time.sleep(backoff)


def get_embedding_model() -> SentenceTransformer:
    return SentenceTransformer(EMBEDDING_MODEL, device="cpu", token=HF_TOKEN)


def embed_passages(
    model: SentenceTransformer, texts: list[str]
) -> list[list[float]]:
    if not texts:
        return []
    prefixed = [passage_text(t) for t in texts]
    vectors = model.encode(
        prefixed,
        batch_size=ENCODE_BATCH_SIZE,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return [vec.tolist() for vec in vectors]


def recreate_qdrant_collection(
    client: QdrantClient, collection_name: str, vector_size: int
) -> None:
    existing = {c.name for c in client.get_collections().collections}
    if collection_name in existing:
        print(f"[ingest] Dropping existing collection '{collection_name}'...")
        client.delete_collection(collection_name=collection_name)

    client.create_collection(
        collection_name=collection_name,
        vectors_config=models.VectorParams(
            size=vector_size, distance=models.Distance.COSINE
        ),
    )
    client.create_payload_index(
        collection_name=collection_name,
        field_name="act_year",
        field_schema=models.PayloadSchemaType.INTEGER,
        wait=True,
    )
    client.create_payload_index(
        collection_name=collection_name,
        field_name="language",
        field_schema=models.PayloadSchemaType.KEYWORD,
        wait=True,
    )
    client.create_payload_index(
        collection_name=collection_name,
        field_name="section_uid",
        field_schema=models.PayloadSchemaType.KEYWORD,
        wait=True,
    )


def ingest() -> dict:
    print(f"[ingest] Embedding model: {EMBEDDING_MODEL} (CPU)")
    print(f"[ingest] Qdrant: {QDRANT_URL} | collection: {COLLECTION_NAME}")

    model = get_embedding_model()

    print("[ingest] Collecting records...")
    records, prep_stats = collect_all_records(ACTS_DIR, model)
    print(
        f"[ingest] Files scanned: {prep_stats['files_seen']}, "
        f"chunks prepared: {len(records)}"
    )

    max_records_env = os.getenv("INGEST_MAX_RECORDS", "").strip()
    if max_records_env.isdigit() and int(max_records_env) > 0:
        limit = int(max_records_env)
        print(f"[ingest] Applying INGEST_MAX_RECORDS={limit}")
        records = records[:limit]

    if not records:
        print("[ingest] No records to ingest.")
        return {"points_indexed": 0, "vector_size": None}

    client = build_qdrant_client()

    points_indexed = 0
    vector_size = None
    collection_ready = False
    total_batches = (len(records) + UPSERT_BATCH_SIZE - 1) // UPSERT_BATCH_SIZE

    print(f"[ingest] Starting: {len(records)} records in {total_batches} batches")

    for batch_num, start in enumerate(
        range(0, len(records), UPSERT_BATCH_SIZE), start=1
    ):
        batch = records[start : start + UPSERT_BATCH_SIZE]
        vectors = embed_passages(model, [r["embedding_text"] for r in batch])

        if len(vectors) != len(batch):
            raise ValueError(
                f"Embedding count mismatch: {len(vectors)} vectors for {len(batch)} records"
            )

        if not collection_ready:
            vector_size = len(vectors[0])
            print(
                f"[ingest] Recreating collection '{COLLECTION_NAME}' "
                f"(vector_size={vector_size})..."
            )
            recreate_qdrant_collection(client, COLLECTION_NAME, vector_size)
            collection_ready = True

        points = [
            models.PointStruct(
                id=str(uuid.uuid4()), vector=vec, payload=rec["payload"]
            )
            for rec, vec in zip(batch, vectors)
        ]
        upsert_with_retry(client, COLLECTION_NAME, points)
        points_indexed += len(points)
        print(
            f"[ingest] Batch {batch_num}/{total_batches} -> "
            f"{points_indexed}/{len(records)} points indexed"
        )

    print("[ingest] Completed.")
    return {"points_indexed": points_indexed, "vector_size": vector_size}


if __name__ == "__main__":
    summary = ingest()
    print(summary)
