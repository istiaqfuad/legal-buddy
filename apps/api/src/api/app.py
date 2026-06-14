from contextlib import asynccontextmanager

from fastapi import FastAPI

from api.api.endpoints import api_router
from api.core.observability import flush_langsmith, validate_langsmith_auth


@asynccontextmanager
async def lifespan(_: FastAPI):
    validate_langsmith_auth()
    yield
    flush_langsmith()


app = FastAPI(title="Legal Acts RAG API", lifespan=lifespan)

app.include_router(api_router)
