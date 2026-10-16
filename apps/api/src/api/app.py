from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.api.endpoints import api_router
from api.api.middlewares import NeonAuthMiddleware
from api.agents.legal_chat.embedding import get_embedding_model
from api.agents.legal_chat.retrieval import verify_qdrant
from api.core.observability import flush_langsmith, validate_langsmith_auth


@asynccontextmanager
async def lifespan(_: FastAPI):
    validate_langsmith_auth()
    # Warm the embedding model during startup so the FIRST chat request isn't
    # slow (or racing a model download). uvicorn does not accept requests until
    # lifespan startup completes, so a passing /rag/health implies "model ready",
    # which the compose healthcheck relies on to gate the web service.
    get_embedding_model()
    # Fail fast if the vector store is unreachable/misconfigured: this raises
    # during startup, so the container never becomes healthy (and web stays
    # gated) instead of erroring on the first query.
    verify_qdrant()
    yield
    flush_langsmith()


app = FastAPI(title="Legal Acts RAG API", lifespan=lifespan)

@app.get("/health", tags=["Health"])
async def root_health() -> dict:
    return {"status": "ok"}

# CORS — allow Next.js frontend (server-to-server calls don't need CORS, but
# useful when running locally without the reverse proxy).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://web:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional JWT auth: enriches request.state with user context if a valid
# Bearer token is present. Does NOT reject unauthenticated requests —
# access control is enforced at the Next.js API route layer.
app.add_middleware(NeonAuthMiddleware)

app.include_router(api_router)
