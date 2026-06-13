import dataclasses
from enum import Enum
from typing import List, Dict, Optional, Any
import json

class Strategy(Enum):
    COST = "cost"
    AVAILABILITY = "availability"

@dataclasses.dataclass
class Provider:
    name: str
    cost_per_1k_tokens: float
    quota_remaining: int
    max_quota: int
    latency_ms: int = 100

    @property
    def is_available(self) -> bool:
        return self.quota_remaining > 0

@dataclasses.dataclass
class Request:
    tokens: int
    payload: str = "test"

@dataclasses.dataclass
class RoutingResult:
    provider_name: str
    cost: float
    success: bool
    message: str

class ThaiGateway:
    def __init__(self):
        self.providers: List[Provider] = []
        self.analytics: Dict[str, Dict[str, Any]] = {}

    def register_provider(self, provider: Provider):
        self.providers.append(provider)
        # Initialize analytics for new provider
        self.analytics[provider.name] = {
            "total_requests": 0,
            "total_cost": 0.0,
            "tokens_processed": 0
        }

    def _calculate_cost(self, provider: Provider, tokens: int) -> float:
        return (tokens / 1000) * provider.cost_per_1k_tokens

    def route(self, request: Request, strategy: Strategy) -> RoutingResult:
        # Filter available providers
        available_providers = [p for p in self.providers if p.is_available]
        
        if not available_providers:
            return RoutingResult(
                provider_name="None",
                cost=0.0,
                success=False,
                message="All providers exhausted or unavailable"
            )

        # Sort based on strategy
        if strategy == Strategy.COST:
            # Sort by cost (ascending)
            available_providers.sort(key=lambda p: p.cost_per_1k_tokens)
        elif strategy == Strategy.AVAILABILITY:
            # Sort by remaining quota (descending) to maximize availability
            available_providers.sort(key=lambda p: p.quota_remaining, reverse=True)

        selected_provider = available_providers[0]
        
        # Execute logic (simulate processing)
        cost = self._calculate_cost(selected_provider, request.tokens)
        
        # Check if request fits in quota (simple check: 1 token = 1 unit quota for simplicity, 
        # or we could assume quota is request count. Let's assume quota is token capacity).
        if selected_provider.quota_remaining < request.tokens:
            # This specific provider can't handle the size, try next
            # For this simplified logic, we just fail or try next. 
            # Let's implement a simple fallback loop.
            for p in available_providers[1:]:
                if p.quota_remaining >= request.tokens:
                    selected_provider = p
                    cost = self._calculate_cost(selected_provider, request.tokens)
                    break
            else:
                return RoutingResult(
                    provider_name="None",
                    cost=0.0,
                    success=False,
                    message="No provider has sufficient quota for this request size"
                )

        # Update State
        selected_provider.quota_remaining -= request.tokens
        
        # Update Analytics
        stats = self.analytics[selected_provider.name]
        stats["total_requests"] += 1
        stats["total_cost"] += cost
        stats["tokens_processed"] += request.tokens

        return RoutingResult(
            provider_name=selected_provider.name,
            cost=cost,
            success=True,
            message="Request routed successfully"
        )

    def get_analytics(self) -> Dict[str, Any]:
        return self.analytics

    def get_dashboard_data(self) -> str:
        """Returns a JSON string suitable for a dashboard frontend."""
        dashboard = {
            "providers": [],
            "global_stats": {
                "total_cost": sum(p["total_cost"] for p in self.analytics.values()),
                "total_requests": sum(p["total_requests"] for p in self.analytics.values())
            }
        }
        
        for p in self.providers:
            p_stats = self.analytics.get(p.name, {})
            dashboard["providers"].append({
                "name": p.name,
                "quota_utilization": 1.0 - (p.quota_remaining / p.max_quota),
                "total_cost": p_stats.get("total_cost", 0.0),
                "request_count": p_stats.get("total_requests", 0)
            })
            
        return json.dumps(dashboard, indent=2)
