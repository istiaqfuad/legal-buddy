from functools import lru_cache

from langsmith import trace
from sentence_transformers import SentenceTransformer

from api.core.config import config


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    """Load the HuggingFace sentence-transformers model once, on CPU."""
    return SentenceTransformer(
        config.EMBEDDING_MODEL,
        device="cpu",
        token=config.HF_TOKEN,
    )


def _apply_query_prefix(text: str) -> str:
    # e5-family models are asymmetric and expect a "query:" prefix on queries
    # (passages are embedded with a "passage:" prefix at ingestion time).
    if "e5" in config.EMBEDDING_MODEL.lower():
        return f"query: {text}"
    return text


def embed_text_query(text: str, *, max_input_chars: int = 2048) -> list[float]:
    query_text = _apply_query_prefix(text[:max_input_chars])
    model = get_embedding_model()
    vector = model.encode(query_text, normalize_embeddings=True)
    return vector.tolist()


def embed_text_query_with_trace(
    text: str,
    *,
    max_input_chars: int,
    traced: bool,
) -> list[float]:
    if not traced:
        return embed_text_query(text, max_input_chars=max_input_chars)

    query_text = text[:max_input_chars]
    with trace(
        name="embed-query",
        run_type="embedding",
        inputs={
            "input_chars": len(query_text),
            "max_input_chars": max_input_chars,
        },
        metadata={
            "provider": "sentence-transformers",
            "ls_model_name": config.EMBEDDING_MODEL,
        },
    ) as embedding_span:
        vector = embed_text_query(text, max_input_chars=max_input_chars)
        embedding_span.end(outputs={"embedding_dimensions": len(vector)})
        return vector
