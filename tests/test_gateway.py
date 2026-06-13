import pytest
from gateway import ThaiGateway, Provider, Request, Strategy

def setup_gateway():
    gw = ThaiGateway()
    # Provider 1: Cheap, low quota
    gw.register_provider(Provider(
        name="CheapAI", 
        cost_per_1k_tokens=0.50, 
        quota_remaining=1000, 
        max_quota=1000
    ))
    # Provider 2: Expensive, high quota
    gw.register_provider(Provider(
        name="ExpensiveAI", 
        cost_per_1k_tokens=2.00, 
        quota_remaining=10000, 
        max_quota=10000
    ))
    # Provider 3: Mid-range, mid quota
    gw.register_provider(Provider(
        name="MidAI", 
        cost_per_1k_tokens=1.00, 
        quota_remaining=5000, 
        max_quota=5000
    ))
    return gw

def test_routes_to_cheapest_provider():
    gw = setup_gateway()
    req = Request(tokens=100)
    
    # Strategy: COST
    result = gw.route(req, Strategy.COST)
    
    assert result.success is True
    assert result.provider_name == "CheapAI"
    assert result.cost == 0.05 # (100/1000) * 0.50
    
    # Verify quota decreased
    provider = next(p for p in gw.providers if p.name == "CheapAI")
    assert provider.quota_remaining == 900

def test_quota_monitoring_and_throttling():
    gw = setup_gateway()
    
    # Exhaust CheapAI
    large_req = Request(tokens=1000)
    gw.route(large_req, Strategy.COST)
    
    provider = next(p for p in gw.providers if p.name == "CheapAI")
    assert provider.quota_remaining == 0
    
    # Next request with COST strategy should skip CheapAI (throttled/exhausted)
    # and go to MidAI (next cheapest)
    req = Request(tokens=100)
    result = gw.route(req, Strategy.COST)
    
    assert result.success is True
    assert result.provider_name == "MidAI"
    assert result.cost == 0.10 # (100/1000) * 1.00

def test_routes_to_most_available():
    gw = setup_gateway()
    
    # Use some quota from MidAI and ExpensiveAI to make CheapAI the "most available" 
    # in terms of remaining percentage, or just test raw remaining quota logic.
    # The implementation sorts by quota_remaining descending.
    
    req = Request(tokens=100)
    result = gw.route(req, Strategy.AVAILABILITY)
    
    # ExpensiveAI has 10000, MidAI 5000, CheapAI 1000.
    # Should pick ExpensiveAI
    assert result.provider_name == "ExpensiveAI"

def test_exhaustion_handling():
    gw = ThaiGateway()
    gw.register_provider(Provider("TinyAI", 1.0, 10, 10))
    
    # Request larger than quota
    req = Request(tokens=20)
    result = gw.route(req, Strategy.COST)
    
    assert result.success is False
    assert "No provider has sufficient quota" in result.message

def test_cost_analytics_and_dashboard():
    gw = setup_gateway()
    
    # Send 2 requests to CheapAI
    gw.route(Request(tokens=100), Strategy.COST)
    gw.route(Request(tokens=100), Strategy.COST)
    
    # Send 1 request to ExpensiveAI (force it by exhausting others or using Availability)
    gw.route(Request(tokens=100), Strategy.AVAILABILITY)
    
    analytics = gw.get_analytics()
    
    # Verify CheapAI stats
    assert analytics["CheapAI"]["total_requests"] == 2
    assert analytics["CheapAI"]["total_cost"] == 0.10 # 2 * 0.05
    
    # Verify ExpensiveAI stats
    assert analytics["ExpensiveAI"]["total_requests"] == 1
    assert analytics["ExpensiveAI"]["total_cost"] == 0.20 # 1 * 0.20
    
    # Verify Dashboard JSON structure
    dashboard_json = gw.get_dashboard_data()
    assert "CheapAI" in dashboard_json
    assert "total_cost" in dashboard_json
    assert "quota_utilization" in dashboard_json
