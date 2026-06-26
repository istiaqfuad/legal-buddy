import functools
import inspect
import logging
import os

from langsmith import Client, trace
from langsmith.utils import tracing_is_enabled

from api.core.config import config

logger = logging.getLogger(__name__)

_langsmith_client: Client | None = None


def configure_tracing() -> None:
    """Forward config values into the env vars the LangSmith SDK reads.

    The SDK is driven entirely by environment variables, but settings are loaded
    from ``.env`` via pydantic (which does not export them to the process
    environment), so we bridge them explicitly here.
    """
    if not config.LANGSMITH_TRACING or not config.LANGSMITH_API_KEY:
        os.environ["LANGSMITH_TRACING"] = "false"
        return

    os.environ["LANGSMITH_TRACING"] = "true"
    os.environ["LANGSMITH_API_KEY"] = config.LANGSMITH_API_KEY
    if config.LANGSMITH_ENDPOINT:
        os.environ["LANGSMITH_ENDPOINT"] = config.LANGSMITH_ENDPOINT
    if config.LANGSMITH_PROJECT:
        os.environ["LANGSMITH_PROJECT"] = config.LANGSMITH_PROJECT


# Apply configuration on import, before any tracing runs.
configure_tracing()


def get_langsmith_client() -> Client | None:
    global _langsmith_client

    if not tracing_is_enabled():
        return None

    if _langsmith_client is None:
        _langsmith_client = Client()
    return _langsmith_client


def traced(name, *, run_type, inputs_fn=None, outputs_fn=None, metadata_fn=None):
    """Wrap a function in a LangSmith span — a no-op when tracing is disabled.

    The single place the traced/untraced decision lives. When disabled, the
    wrapped function runs untouched and the inputs/outputs extractors are never
    called (they only matter for the span).
    """

    def deco(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            if get_langsmith_client() is None:
                return fn(*args, **kwargs)
            bound = inspect.signature(fn).bind(*args, **kwargs)
            bound.apply_defaults()
            call_args = bound.arguments
            with trace(
                name=name,
                run_type=run_type,
                inputs=inputs_fn(**call_args) if inputs_fn else None,
                metadata=metadata_fn(**call_args) if metadata_fn else None,
            ) as span:
                result = fn(*args, **kwargs)
                if outputs_fn is not None:
                    span.end(outputs=outputs_fn(result))
                return result

        return wrapper

    return deco


def validate_langsmith_auth() -> None:
    client = get_langsmith_client()
    if client is None:
        logger.info(
            "LangSmith disabled or not configured. Set LANGSMITH_TRACING=true and "
            "LANGSMITH_API_KEY to enable tracing."
        )
        return

    try:
        next(iter(client.list_projects(limit=1)), None)
        logger.info("LangSmith auth check passed.")
    except Exception:
        logger.exception("LangSmith auth check failed. Traces may not be ingested.")


def flush_langsmith() -> None:
    client = get_langsmith_client()
    if client is None:
        return

    try:
        client.flush()
    except Exception:
        logger.exception("Failed to flush LangSmith events.")
