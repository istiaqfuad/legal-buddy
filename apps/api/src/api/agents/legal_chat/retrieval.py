from urllib.parse import urlparse

from langsmith import trace
from qdrant_client import QdrantClient

from api.api.models import SourceItem
from api.core.config import config
from api.core.observability import get_langsmith_client

from api.agents.legal_chat.embedding import embed_text_query_with_trace

# Parent-document retrieval (#4): pull several chunks per query, then collapse to
# unique sections so the LLM receives whole sections (not headless split parts) and
# duplicate parts of one section don't crowd out other relevant sections.
CANDIDATE_MULTIPLIER = 5
MIN_CANDIDATES = 20


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


def _hits_to_sources(hits, top_k: int) -> list[SourceItem]:
    """Collapse raw chunk hits to the top_k unique sections (parent-document)."""
    sources: list[SourceItem] = []
    seen: set = set()
    for hit in hits:
        payload = hit.payload or {}
        # section_uid is written by the improved ingest; fall back to a composite key
        # so this still behaves sanely against older collections without it.
        uid = payload.get("section_uid") or (
            f"{payload.get('source_url')}#{payload.get('section_index')}"
        )
        if uid in seen:
            continue
        seen.add(uid)
        # Prefer the full section text; fall back to the chunk excerpt.
        excerpt = str(
            payload.get("section_full") or payload.get("section_content_clean") or ""
        ).strip() or "No excerpt available."
        sources.append(
            SourceItem(
                citation_id=len(sources) + 1,
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
        if len(sources) >= top_k:
            break
    return sources


def retrieve_sources(question: str, top_k: int) -> list[SourceItem]:
    candidate_limit = max(top_k * CANDIDATE_MULTIPLIER, MIN_CANDIDATES)
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
            limit=candidate_limit,
            with_payload=True,
        ).points
        return _hits_to_sources(hits, top_k)

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
                "candidate_limit": candidate_limit,
            },
            metadata={"provider": "qdrant"},
        ) as search_span:
            hits = _qdrant_client.query_points(
                collection_name=config.QDRANT_COLLECTION,
                query=vector,
                limit=candidate_limit,
                with_payload=True,
            ).points
            search_span.end(outputs={"hit_count": len(hits)})

        sources = _hits_to_sources(hits, top_k)

        retrieval_span.end(
            outputs={
                "source_count": len(sources),
                "top_score": max((source.score for source in sources), default=0.0),
            }
        )
        return sources
