import instructor
from google import genai
from google.genai import types
from langsmith import trace

from api.api.models import SourceItem
from api.core.config import config
from api.core.observability import get_langsmith_client

from api.agents.legal_chat.structured_models import StructuredLegalAnswer

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
DEFAULT_TEMPERATURE = 0.2
DEFAULT_TOP_P = 0.9


def _extract_gemini_usage(response: types.GenerateContentResponse) -> dict[str, int]:
    usage = getattr(response, "usage_metadata", None)
    if usage is None:
        return {}

    input_tokens = getattr(usage, "prompt_token_count", None)
    output_tokens = getattr(usage, "candidates_token_count", None)
    total_tokens = getattr(usage, "total_token_count", None)

    usage_details: dict[str, int] = {}
    if input_tokens is not None:
        usage_details["input_tokens"] = int(input_tokens)
    if output_tokens is not None:
        usage_details["output_tokens"] = int(output_tokens)
    if total_tokens is not None:
        usage_details["total_tokens"] = int(total_tokens)

    return usage_details


def _source_tag_list(source_ids: list[int]) -> str:
    return " ".join([f"[Source {source_id}]" for source_id in source_ids])


def _normalize_source_ids(source_ids: list[int], max_source_id: int) -> list[int]:
    valid_ids = {
        int(source_id)
        for source_id in source_ids
        if isinstance(source_id, int) and 1 <= source_id <= max_source_id
    }
    return sorted(valid_ids)


def _render_structured_answer(answer: StructuredLegalAnswer, max_source_id: int) -> str:
    lines: list[str] = []
    answer_text = answer.answer.strip()
    citation_ids = _normalize_source_ids(answer.citations, max_source_id)
    source_tags = _source_tag_list(citation_ids)
    if source_tags:
        lines.append(f"{answer_text} {source_tags}")
    else:
        lines.append(answer_text)

    if answer.limitations:
        lines.append(f"\nLimitations: {answer.limitations.strip()}")

    return "\n".join(lines).strip()


def _build_structured_messages(messages: list[dict]) -> list[dict]:
    if len(messages) < 2:
        return messages

    system_message = messages[0]
    user_message = messages[1]
    structured_instruction = (
        "\n\nReturn JSON for this schema:\n"
        "- answer: string\n"
        "- citations: int[]\n"
        "- limitations: string | null\n"
        "Rules:\n"
        "- Use only source ids from provided [Source n] context.\n"
        "- Never invent citations.\n"
        "- Keep answer concise, natural, and grounded."
    )
    return [
        system_message,
        {
            "role": "user",
            "content": f"{user_message['content']}{structured_instruction}",
        },
    ]


# --------------------------------------------------------------------------- #
# Gemini
# --------------------------------------------------------------------------- #

def _gemini_config(temperature: float, max_tokens: int | None) -> types.GenerateContentConfig:
    kwargs: dict[str, int | float] = {"temperature": temperature, "top_p": DEFAULT_TOP_P}
    if max_tokens is not None:
        kwargs["max_output_tokens"] = max_tokens
    return types.GenerateContentConfig(**kwargs)


def _run_gemini_text(
    messages: list[dict], model: str, temperature: float, max_tokens: int | None
) -> str:
    if not config.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured")
    client = genai.Client(api_key=config.GEMINI_API_KEY)
    response = client.models.generate_content(
        model=model,
        contents=[message["content"] for message in messages],
        config=_gemini_config(temperature, max_tokens),
    )
    return response.text or "No response generated."


def _run_gemini(
    messages: list[dict],
    sources: list[SourceItem],
    model: str,
    temperature: float,
    max_tokens: int | None,
) -> str:
    if not config.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured")

    client = genai.Client(api_key=config.GEMINI_API_KEY)
    structured_client = instructor.from_genai(
        client, model=model, mode=instructor.Mode.GENAI_STRUCTURED_OUTPUTS
    )
    structured_messages = _build_structured_messages(messages)
    max_source_id = len(sources)
    try:
        structured_answer = structured_client.create(
            response_model=StructuredLegalAnswer,
            messages=structured_messages,
            config=_gemini_config(temperature, max_tokens),
        )
        return _render_structured_answer(structured_answer, max_source_id)
    except Exception:
        return _run_gemini_text(messages, model, temperature, max_tokens)


# --------------------------------------------------------------------------- #
# Groq (OpenAI-compatible)
# --------------------------------------------------------------------------- #

def _run_groq(
    messages: list[dict],
    sources: list[SourceItem],
    model: str,
    temperature: float,
    max_tokens: int | None,
) -> str:
    if not config.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured")
    from openai import OpenAI

    base = OpenAI(api_key=config.GROQ_API_KEY, base_url=GROQ_BASE_URL)
    structured_client = instructor.from_openai(base)
    structured_messages = _build_structured_messages(messages)
    max_source_id = len(sources)
    extra: dict = {"max_tokens": max_tokens} if max_tokens is not None else {}
    try:
        structured_answer = structured_client.chat.completions.create(
            model=model,
            response_model=StructuredLegalAnswer,
            messages=structured_messages,
            temperature=temperature,
            **extra,
        )
        return _render_structured_answer(structured_answer, max_source_id)
    except Exception:
        response = base.chat.completions.create(
            model=model, messages=messages, temperature=temperature, **extra
        )
        return response.choices[0].message.content or "No response generated."


# --------------------------------------------------------------------------- #
# Dispatcher
# --------------------------------------------------------------------------- #

def run_llm(
    messages: list[dict],
    sources: list[SourceItem],
    max_tokens: int | None = None,
    *,
    provider: str | None = None,
    model: str | None = None,
    temperature: float | None = None,
) -> str:
    provider = (provider or config.DEFAULT_LLM_PROVIDER or "gemini").lower()
    temperature = DEFAULT_TEMPERATURE if temperature is None else float(temperature)

    if provider == "groq":
        model = model or config.GROQ_MODEL
        runner = _run_groq
        ls_provider = "groq"
    else:
        provider = "gemini"
        model = model or config.CHAT_MODEL
        runner = _run_gemini
        ls_provider = "google_genai"

    if get_langsmith_client() is None:
        return runner(messages, sources, model, temperature, max_tokens)

    with trace(
        name="answer-generation",
        run_type="llm",
        inputs={"messages": _build_structured_messages(messages)},
        metadata={
            "ls_provider": ls_provider,
            "ls_model_name": model,
            "temperature": temperature,
            "top_p": DEFAULT_TOP_P,
            **({"max_output_tokens": max_tokens} if max_tokens is not None else {}),
        },
    ) as generation:
        answer_text = runner(messages, sources, model, temperature, max_tokens)
        generation.end(outputs={"output": answer_text})
        return answer_text
