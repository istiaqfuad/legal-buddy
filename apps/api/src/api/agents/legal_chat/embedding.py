from api.core.config import config
from api.core.observability import traced
from shared.embedding import embed_query, is_e5, load_embedding_model


def get_embedding_model():
    """The query-side embedding model — same loader the ingestion side uses."""
    return load_embedding_model(config.EMBEDDING_MODEL, config.HF_TOKEN)


@traced(
    "embed-query",
    run_type="embedding",
    inputs_fn=lambda text, max_input_chars=2048: {
        "input_chars": len(text[:max_input_chars]),
        "max_input_chars": max_input_chars,
    },
    metadata_fn=lambda **_: {
        "provider": "sentence-transformers",
        "ls_model_name": config.EMBEDDING_MODEL,
    },
    outputs_fn=lambda vector: {"embedding_dimensions": len(vector)},
)
def embed_text_query(text: str, *, max_input_chars: int = 2048) -> list[float]:
    model = get_embedding_model()
    return embed_query(model, text[:max_input_chars], is_e5(config.EMBEDDING_MODEL))
