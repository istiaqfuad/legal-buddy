"""Shared helpers for the chunking A/B eval: env, Qdrant client, embedding model,
gold-key matching, and retrieval metrics.

Gold key for a section is the pair (act_file, section_ord) where act_file is the
source filename stem (e.g. "act-print-11") and section_ord is the 0-based index of
the section inside that act's ``sections`` list. This identity is independent of the
chunking strategy, so the same gold set scores both collections fairly.
"""
import functools
import os
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
ACTS_DIR = ROOT / "data" / "acts"
EVAL_DIR = ROOT / "eval"
load_dotenv(ROOT / ".env")

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL")
HF_TOKEN = os.getenv("HF_TOKEN") or None
QDRANT_URL = os.getenv("QDRANT_VECTORESTORE", "http://213.136.80.53:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY") or None
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or None

_IS_E5 = bool(EMBEDDING_MODEL) and "e5" in EMBEDDING_MODEL.lower()

COLLECTION_BASELINE = "legal_acts_eval_baseline"
COLLECTION_IMPROVED = "legal_acts_eval_improved"


def build_qdrant_client():
    from qdrant_client import QdrantClient

    parsed = urlparse(QDRANT_URL)
    kwargs = {"url": QDRANT_URL, "api_key": QDRANT_API_KEY, "timeout": 300}
    if parsed.scheme == "https" and parsed.port is None:
        kwargs["port"] = 443
    return QdrantClient(**kwargs)


@functools.lru_cache(maxsize=1)
def get_model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(EMBEDDING_MODEL, device="cpu", token=HF_TOKEN)


def query_text(text: str) -> str:
    return f"query: {text}" if _IS_E5 else text


def passage_text(text: str) -> str:
    return f"passage: {text}" if _IS_E5 else text


def embed_queries(texts: list[str]) -> list[list[float]]:
    model = get_model()
    vecs = model.encode(
        [query_text(t) for t in texts],
        batch_size=32,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return [v.tolist() for v in vecs]


def gold_key(act_file: str, section_ord) -> str:
    return f"{act_file}#{section_ord}"


# ----- metrics -----

def recall_at_k(ranked_keys: list[str], gold: str, ks=(1, 3, 5, 10)) -> dict:
    out = {}
    for k in ks:
        out[k] = 1.0 if gold in ranked_keys[:k] else 0.0
    return out


def reciprocal_rank(ranked_keys: list[str], gold: str) -> float:
    for i, key in enumerate(ranked_keys, start=1):
        if key == gold:
            return 1.0 / i
    return 0.0


def dedupe_preserve(keys: list[str]) -> list[str]:
    seen, out = set(), []
    for k in keys:
        if k not in seen:
            seen.add(k)
            out.append(k)
    return out
