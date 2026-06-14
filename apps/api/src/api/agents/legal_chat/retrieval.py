from urllib.parse import urlparse

from langsmith import trace
from qdrant_client import QdrantClient

from api.api.models import SourceItem
from api.core.config import config
from api.core.observability import get_langsmith_client

from api.agents.legal_chat.embedding import embed_text_query_with_trace


def _build_qdrant_client() -> QdrantClient:
    parsed = urlparse(config.QDRANT_VECTORESTORE)
    kwargs: dict = {
        "url": config.QDRANT_VECTORESTORE,
        "api_key": config.QDRANT_API_KEY,
        "timeout": 30,
    }
    # qdrant-client defaults to port 6333 when the URL omits a port; an https
    # endpoint behind a reverse proxy (e.g. Cloudflare) is served on 443.
    if parsed.scheme == "https" and parsed.port is None:
        kwargs["port"] = 443
    return QdrantClient(**kwargs)


_qdrant_client = _build_qdrant_client()


def retrieve_sources(question: str, top_k: int) -> list[SourceItem]:
    client = get_langsmith_client()
    if client is None:
        vector = embed_text_query_with_trace(
            question,
            max_input_chars=2048,
            traced=False,
        )
        hits = _qdrant_client.query_points(
            collection_name=config.QDRANT_COLLECTION,
            query=vector,
            limit=top_k,
            with_payload=True,
        ).points

        sources: list[SourceItem] = []
        for idx, hit in enumerate(hits, start=1):
            payload = hit.payload or {}
            excerpt = str(payload.get("section_content_clean") or "").strip()
            if not excerpt:
                excerpt = "No excerpt available."
            sources.append(
                SourceItem(
                    citation_id=idx,
                    act_title=payload.get("act_title"),
                    act_year=payload.get("act_year"),
                    section_index=(
                        str(payload.get("section_index"))
                        if payload.get("section_index") is not None
                        else None
                    ),
                    source_url=payload.get("source_url"),
                    excerpt=excerpt,
                    score=float(hit.score or 0.0),
                )
            )
        return sources

    with trace(
        name="retrieve-sources",
        run_type="chain",
        inputs={"question": question, "top_k": top_k},
    ) as retrieval_span:
        vector = embed_text_query_with_trace(
            question,
            max_input_chars=2048,
            traced=True,
        )

        with trace(
            name="vector-search",
            run_type="retriever",
            inputs={
                "collection": config.QDRANT_COLLECTION,
                "top_k": top_k,
            },
            metadata={"provider": "qdrant"},
        ) as search_span:
            hits = _qdrant_client.query_points(
                collection_name=config.QDRANT_COLLECTION,
                query=vector,
                limit=top_k,
                with_payload=True,
            ).points
            search_span.end(outputs={"hit_count": len(hits)})

        sources: list[SourceItem] = []
        for idx, hit in enumerate(hits, start=1):
            payload = hit.payload or {}
            excerpt = str(payload.get("section_content_clean") or "").strip()
            if not excerpt:
                excerpt = "No excerpt available."
            sources.append(
                SourceItem(
                    citation_id=idx,
                    act_title=payload.get("act_title"),
                    act_year=payload.get("act_year"),
                    section_index=(
                        str(payload.get("section_index"))
                        if payload.get("section_index") is not None
                        else None
                    ),
                    source_url=payload.get("source_url"),
                    excerpt=excerpt,
                    score=float(hit.score or 0.0),
                )
            )

        retrieval_span.end(
            outputs={
                "source_count": len(sources),
                "top_score": max((source.score for source in sources), default=0.0),
            }
        )
        return sources
