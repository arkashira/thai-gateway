import json
from dataclasses import dataclass
from typing import List

@dataclass
class Provider:
    name: str
    quota: int
    cost: float
    available: int

class RateBalancer:
    def __init__(self, providers: List[Provider]):
        self.providers = providers

    def route_request(self):
        cheapest_provider = min(self.providers, key=lambda x: x.cost)
        if cheapest_provider.available > 0:
            cheapest_provider.available -= 1
            return cheapest_provider.name
        else:
            most_available_provider = max(self.providers, key=lambda x: x.available)
            most_available_provider.available -= 1
            return most_available_provider.name

    def monitor_quota(self):
        for provider in self.providers:
            if provider.available <= 0:
                print(f"Quota exhausted for {provider.name}")

    def get_cost_analytics(self):
        total_cost = sum(provider.cost * (provider.quota - provider.available) for provider in self.providers)
        total_quota = sum(provider.quota for provider in self.providers)
        if total_quota == 0:
            return 0
        return total_cost / total_quota

    def expose_dashboard(self):
        dashboard_data = {
            "providers": [
                {"name": provider.name, "quota": provider.quota, "available": provider.available, "cost": provider.cost}
                for provider in self.providers
            ]
        }
        return json.dumps(dashboard_data)
