"""
A lightweight, self‑hosted gateway that balances calls across multiple AI
providers while translating prompts into Thai.

The implementation is intentionally minimal so it can be dropped into any
product that needs a “round‑robin” router with per‑provider rate limits.
"""

from __future__ import annotations

from typing import Dict, Iterable, Tuple


class ThaiGateway:
    """
    Parameters
    ----------
    providers : Iterable[str]
        Names of the downstream providers (e.g. ``["openai", "anthropic"]``).
    rate_limits : Dict[str, int]
        Max calls per minute for each provider.  Providers not listed are
        treated as unlimited.
    """

    def __init__(self, providers: Iterable[str], rate_limits: Dict[str, int]):
        self.providers = list(providers)
        self.rate_limits = dict(rate_limits)
        self._usage: Dict[str, int] = {p: 0 for p in self.providers}

    # ------------------------------------------------------------------ #
    #  Public API
    # ------------------------------------------------------------------ #

    def translate_prompt(self, prompt: str, target_lang: str = "th") -> str:
        """
        Dummy translation – in production this would call a real translation
        service.  Returning a prefixed string keeps the implementation
        deterministic for tests.
        """
        return f"[{target_lang}] {prompt}"

    def route(self, prompt: str) -> Tuple[str, str]:
        """
        Return a tuple ``(provider, translated_prompt)``.  The provider is
        chosen round‑robin while respecting the configured rate limits.
        Raises ``RuntimeError`` if all providers are exhausted.
        """
        for provider in self.providers:
            limit = self.rate_limits.get(provider, 0)
            if limit == 0 or self._usage[provider] < limit:
                self._usage[provider] += 1
                return provider, self.translate_prompt(prompt)

        raise RuntimeError("All providers exhausted – rate limits reached")

    def reset(self) -> None:
        """Reset usage counters – useful for unit tests."""
        self._usage = {p: 0 for p in self.providers}