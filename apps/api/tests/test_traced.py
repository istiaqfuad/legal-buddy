"""Tests for the `traced` decorator seam in api.core.observability.

The seam is the one place tracing is decided. These tests exercise it through
its public interface: a decorated function behaves identically with tracing off,
and forwards the right span fields with tracing on.
"""

import pytest

from api.core import observability as obs
from api.core.observability import traced


def test_disabled_returns_result_and_skips_extractors(monkeypatch):
    """Tracing off -> decorated fn returns the real result and pays nothing:
    the inputs/outputs extractors are never invoked."""
    monkeypatch.setattr(obs, "get_langsmith_client", lambda: None)
    calls: list[str] = []

    @traced(
        "x",
        run_type="chain",
        inputs_fn=lambda **_: calls.append("in") or {},
        outputs_fn=lambda result: calls.append("out") or {},
    )
    def add(a, b):
        return a + b

    assert add(2, 3) == 5
    assert calls == []


class _FakeSpan:
    def __init__(self):
        self.ended_with = None

    def end(self, **kwargs):
        self.ended_with = kwargs


class _FakeTrace:
    def __init__(self, span):
        self._span = span

    def __enter__(self):
        return self._span

    def __exit__(self, *exc):
        return False


def test_enabled_forwards_span_fields(monkeypatch):
    """Tracing on -> open a span with the extracted name/run_type/inputs/metadata,
    run the fn, and forward outputs_fn(result) to span.end. Result is returned."""
    monkeypatch.setattr(obs, "get_langsmith_client", lambda: object())  # truthy

    span = _FakeSpan()
    captured: dict = {}

    def fake_trace(*, name, run_type, inputs=None, metadata=None):
        captured.update(
            name=name, run_type=run_type, inputs=inputs, metadata=metadata
        )
        return _FakeTrace(span)

    monkeypatch.setattr(obs, "trace", fake_trace)

    @traced(
        "vector-search",
        run_type="retriever",
        inputs_fn=lambda **a: {"collection": a["collection"]},
        metadata_fn=lambda **a: {"provider": "qdrant"},
        outputs_fn=lambda result: {"hit_count": len(result)},
    )
    def search(collection, vector):
        return [1, 2, 3]

    out = search("acts", [0.1, 0.2])

    assert out == [1, 2, 3]
    assert captured == {
        "name": "vector-search",
        "run_type": "retriever",
        "inputs": {"collection": "acts"},
        "metadata": {"provider": "qdrant"},
    }
    assert span.ended_with == {"outputs": {"hit_count": 3}}


def test_enabled_propagates_error_without_recording_outputs(monkeypatch):
    """A failure inside the fn propagates; outputs_fn is not called and the span is
    not ended with outputs (so the langsmith context records the error itself)."""
    monkeypatch.setattr(obs, "get_langsmith_client", lambda: object())
    span = _FakeSpan()
    monkeypatch.setattr(obs, "trace", lambda **_: _FakeTrace(span))
    out_calls: list[int] = []

    @traced("answer-generation", run_type="llm", outputs_fn=lambda r: out_calls.append(1) or {})
    def boom():
        raise ValueError("kaboom")

    with pytest.raises(ValueError, match="kaboom"):
        boom()

    assert span.ended_with is None
    assert out_calls == []
