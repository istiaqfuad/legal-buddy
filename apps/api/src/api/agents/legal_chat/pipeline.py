from collections.abc import Iterator

from langsmith import trace

from api.api.models import ChatMessage, LegalChatResponse
from api.core.config import config
from api.core.observability import get_langsmith_client

from api.agents.legal_chat.contextualize import condense_question
from api.agents.legal_chat.generation import run_llm, run_llm_stream
from api.agents.legal_chat.prompting import build_grounded_prompt
from api.agents.legal_chat.retrieval import retrieve_dual

ABSTENTION_TEXT = (
    "I could not find relevant legal sources in the vector store for this question."
)


def _trim_history(history: list[ChatMessage] | None) -> list[ChatMessage]:
    """Hard last-N-turn window (no summarization)."""
    if not history:
        return []
    return history[-config.HISTORY_WINDOW_TURNS :]


def legal_chat_pipeline(
    question: str,
    *,
    history: list[ChatMessage] | None = None,
    top_k: int | None = None,
    max_tokens: int | None = None,
    provider: str | None = None,
    model: str | None = None,
    temperature: float | None = None,
) -> LegalChatResponse:
    resolved_top_k = top_k or config.RETRIEVAL_TOP_K
    resolved_max_tokens = (
        max_tokens if max_tokens is not None else config.ANSWER_MAX_TOKENS
    )
    history = _trim_history(history)
    llm_kwargs = {"provider": provider, "model": model, "temperature": temperature}

    # History-aware retrieval: rewrite a follow-up into a standalone search query
    # (no-op on the first turn). The answer prompt still gets the original question
    # plus the conversation so the reply reads naturally.
    search_query = condense_question(question, history, provider=provider)

    client = get_langsmith_client()
    if client is None:
        statutes, precedents = retrieve_dual(
            search_query, statute_k=resolved_top_k, case_k=config.CASES_TOP_K
        )
        if not statutes and not precedents:
            return LegalChatResponse(answer=ABSTENTION_TEXT, sources=[])

        messages = build_grounded_prompt(question, statutes, precedents, history)
        answer = run_llm(
            messages=messages,
            sources=statutes,
            max_tokens=resolved_max_tokens,
            **llm_kwargs,
        )
        # Precedents are reasoning-only context; only statutes are user-facing sources.
        return LegalChatResponse(answer=answer, sources=statutes)

    with trace(
        name="legal-chat-request",
        run_type="chain",
        inputs={
            "question": question,
            "standalone_query": search_query,
            "history_turns": len(history),
            "top_k": resolved_top_k,
            "max_tokens": resolved_max_tokens,
        },
        metadata={"endpoint": "/rag/legal/chat"},
    ) as request_span:
        statutes, precedents = retrieve_dual(
            search_query, statute_k=resolved_top_k, case_k=config.CASES_TOP_K
        )
        if not statutes and not precedents:
            response = LegalChatResponse(answer=ABSTENTION_TEXT, sources=[])
            request_span.end(outputs=response.model_dump())
            return response

        messages = build_grounded_prompt(question, statutes, precedents, history)
        answer = run_llm(
            messages=messages,
            sources=statutes,
            max_tokens=resolved_max_tokens,
            **llm_kwargs,
        )
        # Precedents are reasoning-only context; only statutes are user-facing sources.
        response = LegalChatResponse(answer=answer, sources=statutes)
        request_span.end(
            outputs={
                "answer_preview": answer[:200],
                "source_count": len(statutes),
                "precedent_count": len(precedents),
            }
        )
        return response


def legal_chat_pipeline_stream(
    question: str,
    *,
    history: list[ChatMessage] | None = None,
    top_k: int | None = None,
    max_tokens: int | None = None,
    provider: str | None = None,
    model: str | None = None,
    temperature: float | None = None,
) -> Iterator[dict]:
    """Streaming variant for the chat UI.

    Yields event dicts: ``{"type": "sources", ...}`` once (known before
    generation), then ``{"type": "delta", "text": ...}`` per token chunk, then
    ``{"type": "done"}``. Uses plain-text generation with inline ``[Source N]``
    citations (no structured wrapper). Untraced for now to keep the stream simple.
    """
    resolved_top_k = top_k or config.RETRIEVAL_TOP_K
    resolved_max_tokens = (
        max_tokens if max_tokens is not None else config.ANSWER_MAX_TOKENS
    )
    history = _trim_history(history)

    search_query = condense_question(question, history, provider=provider)
    statutes, precedents = retrieve_dual(
        search_query, statute_k=resolved_top_k, case_k=config.CASES_TOP_K
    )

    yield {"type": "sources", "sources": [s.model_dump() for s in statutes]}

    if not statutes and not precedents:
        yield {"type": "delta", "text": ABSTENTION_TEXT}
        yield {"type": "done"}
        return

    messages = build_grounded_prompt(question, statutes, precedents, history)
    for chunk in run_llm_stream(
        messages,
        provider=provider,
        model=model,
        temperature=temperature,
        max_tokens=resolved_max_tokens,
    ):
        yield {"type": "delta", "text": chunk}
    yield {"type": "done"}
