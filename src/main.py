# tests/test_error_handling.py
import logging
import pytest
from src import handler, metrics

def test_quota_exceeded_logging_and_metric(monkeypatch, caplog):
    # Simulate a quota‑exceeded error
    class DummyError(Exception):
        provider = "openrouter"
    monkeypatch.setattr(handler, "APIError", DummyError)

    # Capture logs
    caplog.set_level(logging.ERROR)

    # Trigger the handler
    with pytest.raises(DummyError):
        handler.route_request({"prompt": "test"})

    # Assertions
    assert any("request_failed:" in rec.message for rec in caplog.records)
    assert metrics.api_requests_error.labels(provider="openrouter")._value.get() > 0