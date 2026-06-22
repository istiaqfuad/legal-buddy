from langsmith import trace

from api.api.models import SourceItem
from api.core.config import config
from api.core.observability import get_langsmith_client

from api.agents.legal_chat.embedding import embed_text_query_with_trace
from shared.qdrant import build_client

# Parent-document retrieval (#4): pull several chunks per query, then collapse to
# unique sections/cases so the LLM receives whole sections (not headless split
# parts) and duplicate parts of one source don't crowd out other relevant ones.
CANDIDATE_MULTIPLIER = 5
MIN_CANDIDATES = 20

_qdrant_client = build_client(
    config.QDRANT_VECTORESTORE, config.QDRANT_API_KEY, timeout=30
)


def _embed(question: str, traced: bool) -> list[float]:
    return embed_text_query_with_trace(question, max_input_chars=2048, traced=traced)


def _search(collection: str, vector: list[float], candidate_limit: int, traced: bool):
    """Run one Qdrant query against `collection`; optionally trace it."""
    if not traced:
        return _qdrant_client.query_points(
            collection_name=collection,
            query=vector,
            limit=candidate_limit,
            with_payload=True,
        ).points
    with trace(
        name="vector-search",
        run_type="retriever",
        inputs={"collection": collection, "candidate_limit": candidate_limit},
        metadata={"provider": "qdrant"},
    ) as search_span:
        hits = _qdrant_client.query_points(
            collection_name=collection,
            query=vector,
            limit=candidate_limit,
            with_payload=True,
        ).points
        search_span.end(outputs={"hit_count": len(hits)})
        return hits


def _hits_to_sources(hits, top_k: int) -> list[SourceItem]:
    """Collapse raw chunk hits to the top_k unique statute sections (parent-doc)."""
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
                source_type="statute",
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


def _case_groups_to_sources(groups, top_k: int) -> list[SourceItem]:
    """Turn Qdrant `query_points_groups` groups (one per case_uid) into sources.

    Grouping in the engine guarantees top_k DISTINCT cases — without it a single
    long judgment (death-reference bundles have 100+ chunks) floods a flat top-N
    candidate pool and crowds out other cases. Cases store no `section_full`
    (whole judgment would blow Qdrant's 32MB limit), so the excerpt is assembled
    from the matching `chunk_text` values: the highest-scoring chunks of the case,
    re-ordered by `chunk_part` for readability.
    """
    sources: list[SourceItem] = []
    for group in groups:
        if len(sources) >= top_k:
            break
        hits = group.hits or []
        if not hits:
            continue
        payload = hits[0].payload or {}  # best hit carries representative metadata
        chunks = sorted(
            (
                (
                    (h.payload or {}).get("chunk_part") or 0,
                    float(h.score or 0.0),
                    str((h.payload or {}).get("chunk_text") or ""),
                )
                for h in hits
            ),
            key=lambda c: c[1],
            reverse=True,
        )[:2]
        chunks = sorted(chunks, key=lambda c: c[0])  # reading order by chunk_part
        excerpt = "\n\n".join(text for _, _, text in chunks if text).strip() or (
            "No excerpt available."
        )
        sources.append(
            SourceItem(
                citation_id=len(sources) + 1,
                source_type="precedent",
                full_case_ref=payload.get("full_case_ref"),
                court=payload.get("division") or payload.get("court"),
                disposition=payload.get("disposition"),
                judgment_date=payload.get("judgment_date"),
                case_year=payload.get("case_year"),
                excerpt=excerpt,
                score=float(hits[0].score or 0.0),
            )
        )
    return sources


def retrieve_sources(
    question: str, top_k: int, *, vector: list[float] | None = None
) -> list[SourceItem]:
    """Retrieve statute sections from the acts collection."""
    candidate_limit = max(top_k * CANDIDATE_MULTIPLIER, MIN_CANDIDATES)
    traced = get_langsmith_client() is not None
    if vector is None:
        vector = _embed(question, traced)
    hits = _search(config.QDRANT_COLLECTION, vector, candidate_limit, traced)
    return _hits_to_sources(hits, top_k)


def retrieve_cases(
    question: str, top_k: int, *, vector: list[float] | None = None
) -> list[SourceItem]:
    """Retrieve top_k distinct precedent cases from the legal_cases collection.

    Uses Qdrant grouping on `case_uid` (a keyword-indexed field) so each result is
    a different case; `group_size` chunks per case feed the excerpt.
    """
    traced = get_langsmith_client() is not None
    if vector is None:
        vector = _embed(question, traced)

    def _run():
        return _qdrant_client.query_points_groups(
            collection_name=config.CASES_COLLECTION,
            query=vector,
            group_by="case_uid",
            limit=top_k,
            group_size=2,
            with_payload=True,
        ).groups

    if not traced:
        return _case_groups_to_sources(_run(), top_k)
    with trace(
        name="vector-search",
        run_type="retriever",
        inputs={"collection": config.CASES_COLLECTION, "group_by": "case_uid", "top_k": top_k},
        metadata={"provider": "qdrant"},
    ) as span:
        groups = _run()
        span.end(outputs={"group_count": len(groups)})
        return _case_groups_to_sources(groups, top_k)


def retrieve_dual(
    question: str, *, statute_k: int, case_k: int
) -> tuple[list[SourceItem], list[SourceItem]]:
    """Dual-retrieve, returning (statutes, precedents) SEPARATELY.

    The query is embedded once and reused for both collections. Sub-floor hits are
    dropped. Only STATUTES are citable user-facing sources, so only they get
    sequential citation ids; PRECEDENTS are reasoning-only background (not shown to
    the user, never cited), so they keep their raw ids and are passed to the prompt
    as an unnumbered context block.
    """
    traced = get_langsmith_client() is not None
    vector = _embed(question, traced)

    statutes = [
        s
        for s in retrieve_sources(question, statute_k, vector=vector)
        if s.score >= config.STATUTE_SCORE_FLOOR
    ]
    precedents = [
        c
        for c in retrieve_cases(question, case_k, vector=vector)
        if c.score >= config.CASE_SCORE_FLOOR
    ]

    for new_id, source in enumerate(statutes, start=1):
        source.citation_id = new_id
    return statutes, precedents
