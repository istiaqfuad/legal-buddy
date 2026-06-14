from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Gemini chat model
    GEMINI_API_KEY: str | None = None
    CHAT_MODEL: str = "gemini-2.5-flash"

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

    POSTGRES_CONNECTION_STRING: str | None = None

    RETRIEVAL_TOP_K: int = 6
    ANSWER_MAX_TOKENS: int | None = None


config = Config()
