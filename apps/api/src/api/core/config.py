from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Chat LLM. provider selects the backend; each has its own default model.
    DEFAULT_LLM_PROVIDER: str = "gemini"  # "gemini" | "groq"
    GEMINI_API_KEY: str | None = None
    CHAT_MODEL: str = "gemini-2.5-flash"
    # Groq (OpenAI-compatible). Useful for testing without the Gemini free-tier cap.
    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Fast/cheap models for the multi-turn query rewrite (history-aware retrieval).
    # Independent of the answer model above — the rewrite is a tiny, latency-
    # sensitive call, so it uses the smallest model per provider.
    GEMINI_CONDENSE_MODEL: str = "gemini-2.5-flash-lite"
    GROQ_CONDENSE_MODEL: str = "llama-3.1-8b-instant"
    # Turns of conversation history kept for the rewrite and answer prompt.
    HISTORY_WINDOW_TURNS: int = 6

    # HuggingFace embedding model (run locally via sentence-transformers)
    HF_TOKEN: str | None = None
    EMBEDDING_MODEL: str

    LANGSMITH_TRACING: bool = True
    LANGSMITH_API_KEY: str | None = None
    LANGSMITH_ENDPOINT: str | None = None
    LANGSMITH_PROJECT: str | None = "legal-buddy"

    # Qdrant vector store
    QDRANT_VECTORESTORE: str = "http://213.136.80.53:6333"
    QDRANT_API_KEY: str | None = None
    QDRANT_COLLECTION: str = "legal_acts_event_rag_full"
    # Case-law precedent collection (parallel to the acts collection above).
    CASES_COLLECTION: str = "legal_cases"

    POSTGRES_CONNECTION_STRING: str | None = None

    RETRIEVAL_TOP_K: int = 6
    # Precedents to include alongside the statute top-k.
    CASES_TOP_K: int = 4
    # Minimum cosine score for a retrieved source to count as relevant. A corpus
    # whose best hit is below its floor contributes nothing -> drives statute-only
    # fallback (no precedent found) and, when both are empty, abstention.
    # STATUTE floor stays 0.0 (don't touch the working acts path). CASE floor 0.82
    # is empirical for multilingual-e5-base: off-topic scenarios top out ~0.80-0.81,
    # on-point precedents score 0.83-0.86 (thin margin — the Phase-2 reranker is the
    # robust fix; this is a coarse off-topic cut for MV).
    STATUTE_SCORE_FLOOR: float = 0.0
    CASE_SCORE_FLOOR: float = 0.82
    ANSWER_MAX_TOKENS: int | None = None


config = Config()
