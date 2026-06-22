from langsmith import trace

from api.api.models import LegalChatResponse
from api.core.config import config
from api.core.observability import get_langsmith_client

from api.agents.legal_chat.generation import run_llm
from api.agents.legal_chat.prompting import build_grounded_prompt
from api.agents.legal_chat.retrieval import retrieve_dual


def legal_chat_pipeline(
    question: str,
    *,
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
    llm_kwargs = {"provider": provider, "model": model, "temperature": temperature}

    client = get_langsmith_client()
    if client is None:
        statutes, precedents = retrieve_dual(
            question, statute_k=resolved_top_k, case_k=config.CASES_TOP_K
        )
        if not statutes and not precedents:
            return LegalChatResponse(
                answer="I could not find relevant legal sources in the vector store for this question.",
                sources=[],
            )

        messages = build_grounded_prompt(question, statutes, precedents)
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
            "top_k": resolved_top_k,
            "max_tokens": resolved_max_tokens,
        },
        metadata={"endpoint": "/rag/legal/chat"},
    ) as request_span:
        statutes, precedents = retrieve_dual(
            question, statute_k=resolved_top_k, case_k=config.CASES_TOP_K
        )
        if not statutes and not precedents:
            response = LegalChatResponse(
                answer="I could not find relevant legal sources in the vector store for this question.",
                sources=[],
            )
            request_span.end(outputs=response.model_dump())
            return response

        messages = build_grounded_prompt(question, statutes, precedents)
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
