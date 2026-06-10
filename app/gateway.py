from typing import Dict, List
from fastapi import HTTPException

class RateLimiter:
    """
    Very small in‑memory round‑robin rate‑limiter.
    Each provider may handle up to `max_per_provider` requests.
    """
    def __init__(self, providers: List[str], max_per_provider: int = 100):
        self.providers = providers
        self.max_per_provider = max_per_provider
        self.counts: Dict[str, int] = {p: 0 for p in providers}
        self._next_index = 0

    def _next_provider(self) -> str:
        for _ in range(len(self.providers)):
            provider = self.providers[self._next_index]
            self._next_index = (self._next_index + 1) % len(self.providers)
            if self.counts[provider] < self.max_per_provider:
                self.counts[provider] += 1
                return provider
        raise HTTPException(status_code=429, detail="All providers rate‑limited")

    def translate_to_thai(self, prompt: str) -> (str, str):
        """
        Mock translation – prepend a marker.
        In production this would call an external LLM provider.
        """
        provider = self._next_provider()
        translated = f"[Thai] {prompt}"
        return provider, translated

# Singleton instance used by the API
gateway = RateLimiter(providers=["provider1", "provider2", "provider3"])