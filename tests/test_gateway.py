# src/metrics.py
from prometheus_client import Counter, Histogram, start_http_server
import time
import logging

log = logging.getLogger(__name__)

class Metrics:
    """
    Exposes Prometheus metrics for the gateway.
    """

    def __init__(self, port: int = 8001):
        self.requests_total = Counter(
            "thai_gateway_requests_total",
            "Total number of requests routed",
            ["provider"],
        )
        self.response_time = Histogram(
            "thai_gateway_response_time_seconds",
            "Response time per provider",
            ["provider"],
        )
        self.start_server(port)

    def start_server(self, port: int):
        """Start the /metrics HTTP endpoint."""
        start_http_server(port)
        log.info("Prometheus metrics exposed on :%d/metrics", port)

    def record(self, provider: str, duration: float):
        self.requests_total.labels(provider=provider).inc()
        self.response_time.labels(provider=provider).observe(duration)