def test_generate_api_key_on_first_request():
    # Simulate first request from new platform
    response = client.post("/v1/gateway/onboard", headers={"X-Forwarded-For": "203.114.22.1"})
    assert response.status_code == 200
    assert "X-API-Key" in response.headers
    assert len(response.headers["X-API-Key"]) == 64  # SHA-256 encoded key

def test_api_key_scoped_to_platform():
    # Two platforms get keys
    resp1 = client.post("/v1/gateway/onboard", json={"ip": "203.114.22.1"})
    resp2 = client.post("/v1/gateway/onboard", json={"ip": "203.114.22.2"})
    key1 = resp1.headers["X-API-Key"]
    key2 = resp2.headers["X-API-Key"]

    # Key1 should not access Key2's resources
    response = client.get("/v1/gateway/status", headers={"Authorization": f"Bearer {key2}"})
    assert response.json()["platform_id"] != extract_platform_id(key1)

def test_rate_limit_per_platform():
    key = get_test_api_key("platform_001")
    for _ in range(100):
        response = client.get("/v1/gateway/ping", headers={"Authorization": f"Bearer {key}"})
    # 101st should fail
    response = client.get("/v1/gateway/ping", headers={"Authorization": f"Bearer {key}"})
    assert response.status_code == 429
    assert response.json()["error"] == "rate_limit_exceeded"

def test_http_request_rejected():
    # Simulate HTTP (non-TLS) call
    response = insecure_client.get("http://thai-gateway.axentx.dev/v1/ping")
    assert response.status_code == 403
    assert "https_required" in response.json()["error"]