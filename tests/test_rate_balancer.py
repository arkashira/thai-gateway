from rate_balancer import RateBalancer, Provider
import json
import pytest

def test_route_request():
    providers = [
        Provider("Provider1", 10, 0.5, 5),
        Provider("Provider2", 10, 0.3, 8),
        Provider("Provider3", 10, 0.7, 2)
    ]
    rate_balancer = RateBalancer(providers)
    assert rate_balancer.route_request() == "Provider2"

def test_monitor_quota():
    providers = [
        Provider("Provider1", 10, 0.5, 0),
        Provider("Provider2", 10, 0.3, 8),
        Provider("Provider3", 10, 0.7, 2)
    ]
    rate_balancer = RateBalancer(providers)
    rate_balancer.monitor_quota()

def test_get_cost_analytics():
    providers = [
        Provider("Provider1", 10, 0.5, 5),
        Provider("Provider2", 10, 0.3, 8),
        Provider("Provider3", 10, 0.7, 2)
    ]
    rate_balancer = RateBalancer(providers)
    assert round(rate_balancer.get_cost_analytics(), 2) == 0.29

def test_expose_dashboard():
    providers = [
        Provider("Provider1", 10, 0.5, 5),
        Provider("Provider2", 10, 0.3, 8),
        Provider("Provider3", 10, 0.7, 2)
    ]
    rate_balancer = RateBalancer(providers)
    dashboard_data = rate_balancer.expose_dashboard()
    assert json.loads(dashboard_data) == {
        "providers": [
            {"name": "Provider1", "quota": 10, "available": 5, "cost": 0.5},
            {"name": "Provider2", "quota": 10, "available": 8, "cost": 0.3},
            {"name": "Provider3", "quota": 10, "available": 2, "cost": 0.7}
        ]
    }
