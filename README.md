import pytest
from rate_limit_tracker import RateLimitTracker

def test_rate_limit_tracker_initialization():
    tracker = RateLimitTracker()
    assert tracker.providers == {}

def test_add_provider():
    tracker = RateLimitTracker()
    tracker.add_provider("provider1")
    assert "provider1" in tracker.providers
    assert tracker.providers["provider1"] == 0

def test_increment_request_count():
    tracker = RateLimitTracker()
    tracker.add_provider("provider1")
    tracker.increment_request_count("provider1")
    assert tracker.providers["provider1"] == 1

def test_reset_request_count():
    tracker = RateLimitTracker()
    tracker.add_provider("provider1")
    tracker.increment_request_count("provider1")
    tracker.reset_request_count("provider1")
    assert tracker.providers["provider1"] == 0

def test_get_current_request_count():
    tracker = RateLimitTracker()
    tracker.add_provider("provider1")
    tracker.increment_request_count("provider1")
    assert tracker.get_current_request_count("provider1") == 1

def test_concurrent_requests():
    tracker = RateLimitTracker()
    tracker.add_provider("provider1")
    for _ in range(100):
        tracker.increment_request_count("provider1")
    assert tracker.get_current_request_count("provider1") == 100