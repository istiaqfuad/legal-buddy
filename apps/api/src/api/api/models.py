from typing import Literal

from pydantic import BaseModel


class LegalChatRequest(BaseModel):
    question: str
    max_tokens: int | None = None
    top_k: int | None = None
    # Testing knobs (remove in production). provider/model/temperature let the
    # frontend switch LLM backend and tune generation per request.
    provider: Literal["gemini", "groq"] | None = None
    model: str | None = None
    temperature: float | None = None


class SourceItem(BaseModel):
    citation_id: int
    # "statute" (act/section) or "precedent" (court judgment). Defaults to statute
    # so existing acts retrieval is unchanged.
    source_type: Literal["statute", "precedent"] = "statute"
    # Statute fields
    act_title: str | None = None
    act_year: int | None = None
    section_index: str | None = None
    source_url: str | None = None
    # Precedent (case-law) fields
    full_case_ref: str | None = None
    court: str | None = None
    disposition: str | None = None
    judgment_date: str | None = None
    case_year: int | None = None
    excerpt: str
    score: float


class LegalChatResponse(BaseModel):
    answer: str
    sources: list[SourceItem]
