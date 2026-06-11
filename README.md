<h3 align="center">🛠️ thai-gateway</h3>

<div align="center">
  <a href="https://github.com/axentx/thai-gateway/blob/main/LICENSE"><img src="https://img.shields.io/github/license/axentx/thai-gateway" alt="License: MIT"></a>
  <a href="https://github.com/axentx/thai-gateway"><img src="https://img.shields.io/github/stars/axentx/thai-gateway" alt="GitHub stars"></a>
  <a href="https://github.com/axentx/thai-gateway/actions"><img src="https://img.shields.io/github/actions/workflow/status/axentx/thai-gateway/ci.yml?branch=main" alt="Build status"></a>
  <a href="https://github.com/axentx/thai-gateway"><img src="https://img.shields.io/github/languages/count/axentx/thai-gateway" alt="Languages"></a>
</div>

---

# 🚀 thai-gateway

**Power mid‑sized platforms with balanced AI traffic.**  
Thai‑Gateway distributes AI requests across multiple providers to avoid quota exhaustion and cut costs by 30–50 % (≈ $2 K–$10 K/month savings).

## Why thai-gateway?

- **Multi‑API rate balancing** – Dynamically routes traffic to keep each provider within quota limits, preventing service interruptions.
- **Cost reduction** – Optimizes provider usage to lower overall spend by 30–50 % on average.
- **Transparent metrics** – Exposes real‑time health and usage stats via Prometheus & Grafana dashboards.
- **Built for Thai‑language AI** – Seamlessly integrates Thai‑language models and data pipelines.
- **Zero‑downtime scaling** – Supports horizontal scaling across containerized services without service disruption.
- **Open‑source & MIT licensed** – Fully auditable and community‑friendly.

## Feature Overview

| Feature | Description |
|---------|-------------|
| **Provider Health Monitoring** | Periodic checks of OpenRouter, Mistral, Anthropic, etc., with automatic fail‑over. |
| **Dynamic Rate Balancing** | Real‑time distribution of requests based on provider quota, latency, and cost. |
| **Metrics & Observability** | Exposes `/metrics` endpoint for Prometheus; integrates with Grafana dashboards. |
| **Auto‑Scaling Hooks** | Exposes health endpoints for Kubernetes HPA and Docker‑Compose scaling. |
| **Thai‑Language Support** | Dedicated endpoints and data models for Thai‑language AI workloads. |
| **API Gateway Layer** | Unified REST/GraphQL interface for downstream services. |
| **Deployment Automation** | Docker‑based CI/CD pipeline with automated tests and linting. |

## Tech Stack

- **Rust** – Actix‑web for the core gateway service.  
- **Go** – Net/http for middleware utilities.  
- **Node.js** – Express for UI and auxiliary services.  
- **Python** – FastAPI for business logic modules.  
- **PostgreSQL** – Persistent storage for provider metadata and metrics.  
- **Docker** – Containerization and CI/CD.  
- **Prometheus / Grafana** – Observability stack.  

## Project Structure

```
├── app/                # Front‑end UI (React/Next.js)
├── business/           # Business logic (Python)
├── docs/               # Documentation & specs
├── gateway/            # Core gateway (Rust)
├── src/                # Shared source utilities
├── tests/              # Unit & integration tests
├── ai.rs               # AI request handling (Rust)
├── app.js              # Node.js entry point
├── base.py             # Base Python utilities
├── env.js              # Environment configuration
├── health.rs           # Health checks (Rust)
├── healthCheck.js      # Health checks (Node.js)
├── logger.js           # Logging utilities
├── main.rs             # Rust application entry point
├── metrics.js          # Metrics exposition (Node.js)
├── middleware.go       # Go middleware
├── migration.sql       # DB migrations
├── provider.js         # Provider definitions (Node.js)
├── provider_model.go   # Provider models (Go)
├── provider_model_test.go  # Go tests
├── pyproject.toml      # Python package config
├── router.js           # API router (Node.js)
└── ui.js               # UI logic (Node.js)
```

## Getting Started

```bash
# Clone the repo
git clone https://github.com/axentx/thai-gateway.git
cd thai-gateway

# Build & run the Rust gateway
cargo run --release

# Run the Go middleware (if needed)
go run middleware.go

# Start the Node.js UI
cd app
npm install
npm run dev

# Start the Python business layer
poetry install
poetry run python -m business.main
```

> **Tip:** All services expose health endpoints (`/health`) and metrics (`/metrics`) on their respective ports.

## Deploy

```bash
# Build Docker image
docker build -t thai-gateway .

# Run container (exposes port 8080)
docker run -d -p 8080:8080 --name thai-gateway thai-gateway
```

> For Kubernetes, see `k8s/` manifests in the repo (not shown here).

## Status

✅ **Stable** – Last commit: `8dd15fd` (2026‑06‑10) – “code‑build cycle 20260610‑083536‑thai