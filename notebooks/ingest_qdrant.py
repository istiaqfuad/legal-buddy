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

MAX_CHARS_PER_CHUNK = 1200
CHUNK_OVERLAP = 100
UPSERT_BATCH_SIZE = 64
ENCODE_BATCH_SIZE = 32

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


def chunk_section_content(
    text: str, max_chars: int = 1200, overlap: int = 100
) -> list[str]:
    if not text:
        return []
    if len(text) <= max_chars:
        return [text]

    def slice_with_overlap(value: str) -> list[str]:
        chunks, start = [], 0
        while start < len(value):
            end = min(start + max_chars, len(value))
            chunks.append(value[start:end].strip())
            if end >= len(value):
                break
            start = max(0, end - overlap)
        return [chunk for chunk in chunks if chunk]

    parts = [part.strip() for part in SUBSECTION_SPLIT_RE.split(text) if part.strip()]
    if len(parts) > 1:
        merged, current = [], ""
        for part in parts:
            candidate = f"{current} {part}".strip() if current else part
            if len(candidate) <= max_chars:
                current = candidate
                continue

            if current:
                merged.append(current)
                current = ""

            if len(part) <= max_chars:
                current = part
                continue

            merged.extend(slice_with_overlap(part))

        if current:
            merged.append(current)
        if merged:
            return merged

    return slice_with_overlap(text)


def build_embedding_text(
    act_title: str, section_index: str, chunk_part: int, chunk_text: str
) -> str:
    return (
        f"Act: {act_title}\nSection {section_index} (Part {chunk_part}): {chunk_text}"
    )


def collect_all_records(
    acts_dir: Path, max_chars: int = 1200, overlap: int = 100
) -> tuple[list[dict], dict]:
    records = []
    stats = {
        "files_seen": 0,
        "acts_skipped_repealed": 0,
        "acts_skipped_no_sections": 0,
        "sections_seen": 0,
        "sections_skipped_repealed": 0,
        "sections_skipped_empty": 0,
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

        for section in sections:
            stats["sections_seen"] += 1
            raw_content = (section or {}).get("section_content", "")
            if VOID_SECTION_RE.search(raw_content or ""):
                stats["sections_skipped_repealed"] += 1
                continue

            cleaned = clean_section_content(raw_content)
            if not cleaned:
                stats["sections_skipped_empty"] += 1
                continue

            section_index = extract_section_index(cleaned)

            chunks = chunk_section_content(cleaned, max_chars=max_chars, overlap=overlap)
            for chunk_part, chunk_text in enumerate(chunks, start=1):
                payload = {
                    "act_title": act_obj.get("act_title"),
                    "act_no": act_obj.get("act_no"),
                    "act_year": (
                        int(act_obj["act_year"])
                        if str(act_obj.get("act_year", "")).isdigit()
                        else None
                    ),
                    "section_index": section_index,
                    "chunk_part": chunk_part,
                    "language": act_obj.get("language"),
                    "govt_system": act_obj.get("government_context", {}).get(
                        "govt_system"
                    ),
                    "source_url": act_obj.get("source_url"),
                    "section_content_clean": chunk_text,
                }
                records.append(
                    {
                        "embedding_text": build_embedding_text(
                            act_title=act_obj.get("act_title", "Unknown Act"),
                            section_index=section_index,
                            chunk_part=chunk_part,
                            chunk_text=chunk_text,
                        ),
                        "payload": payload,
                    }
                )

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


def ingest() -> dict:
    print(f"[ingest] Embedding model: {EMBEDDING_MODEL} (CPU)")
    print(f"[ingest] Qdrant: {QDRANT_URL} | collection: {COLLECTION_NAME}")

    print("[ingest] Collecting records...")
    records, prep_stats = collect_all_records(
        ACTS_DIR, max_chars=MAX_CHARS_PER_CHUNK, overlap=CHUNK_OVERLAP
    )
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
    model = get_embedding_model()

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
