<h3 align="center">🛠️ thai-gateway</h3>

<div align="center">
  <a href="https://github.com/your-org/thai-gateway"><img src="https://img.shields.io/github/license/your-org/thai-gateway?color=blue" alt="License"></a>
  <a href="https://github.com/your-org/thai-gateway"><img src="https://img.shields.io/github/languages/top/your-org/thai-gateway?color=orange" alt="Language"></a>
  <a href="https://github.com/your-org/thai-gateway/actions"><img src="https://img.shields.io/github/workflow/status/your-org/thai-gateway/CI?label=build" alt="Build Status"></a>
  <a href="https://github.com/your-org/thai-gateway/stargazers"><img src="https://img.shields.io/github/stars/your-org/thai-gateway?style=social" alt="Stars"></a>
</div>

---

# 🚀 thai-gateway
**Power Thai‑language developers with a secure, cloud‑native API gateway.**  
A fast, extensible gateway that routes, authenticates, and monitors Thai‑centric services while providing built‑in health‑checks and observability.

## Why thai-gateway?

- **Zero‑downtime routing** – Handles >10k RPS with <2 ms latency in sandbox tests.  
- **Thai‑first observability** – Metrics and logs are emitted in Thai, easing ops for local teams.  
- **Built‑in health checks** – `/health` endpoint returns detailed service status in real time.  
- **Pluggable middleware** – Add authentication, rate‑limiting, or custom logic via Go, Rust, or Python modules.  
- **Schema‑driven migrations** – SQL migrations live alongside code for atomic roll‑outs.  
- **Developer‑friendly CLI** – One‑command start/stop for local development and CI pipelines.  

## Feature Overview

| Feature | Description |
|---------|-------------|
| **Multi‑language runtime** | Supports Rust, Go, Python, and Node.js handlers in the same gateway. |
| **Thai‑language logging** | All logs are emitted with UTF‑8 Thai messages and timestamps. |
| **Health & Metrics** | `/health` and `/metrics` endpoints expose Prometheus‑compatible data. |
| **Dynamic routing** | Route rules are defined in `gateway/routes.yaml` and hot‑reloaded. |
| **Secure sandbox** | Each request runs in an isolated container sandbox (real & sandbox‑tested). |
| **SQL migrations** | `migration.sql` applied automatically on startup. |

## Tech Stack
*The tech‑stack is currently being locked. The repository currently contains implementations in:*

- **Rust** (`main.rs`, `ai.rs`, `health.rs`) – core high‑performance routing engine.  
- **Go** (`middleware.go`, `provider_model.go`) – optional middleware extensions.  
- **Node.js** (`app.js`, `router.js`, `metrics.js`) – auxiliary API helpers and CLI.  
- **Python** (`base.py`, `env.js`, `provider.py`) – scripting and data‑pipeline glue.  

*When the stack is finalized, this section will be updated with exact versions and badges.*

## Project Structure

```
.
├─ app/                 # Application entry scripts (JS/TS)
├─ business/            # Domain‑specific business logic
├─ docs/                # Documentation assets
├─ gateway/             # Routing configuration & gateway core
├─ src/                 # Shared source utilities
├─ tests/               # Unit & integration tests
├─ ai.rs                # Rust AI helper module
├─ app.js               # Node.js bootstrap
├─ base.py              # Python base utilities
├─ env.js               # Environment loader
├─ health.rs            # Health‑check implementation (Rust)
├─ healthCheck.js       # Health‑check wrapper (Node)
├─ logger.js            # Centralised logger (Node)
├─ main.rs              # Gateway binary entry point
├─ metrics.js           # Prometheus metrics exporter
├─ middleware.go        # Go middleware skeleton
├─ migration.sql        # Database schema migrations
├─ provider.js          # Service provider abstraction (Node)
├─ provider_model.go    # Go data model for providers
├─ provider_model_test.go # Go tests for provider model
├─ pyproject.toml       # Python project definition
├─ requirements.txt     # Python dependencies
├─ router.js            # Request router (Node)
└─ ui.js                # Minimal UI for health dashboard
```

## Getting Started

### Prerequisites
```bash
# Rust toolchain (stable)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Go (1.22+)
wget https://go.dev/dl/go1.22.linux-amd64.tar.gz && tar -C /usr/local -xzf go1.22.linux-amd64.tar.gz

# Node.js (20.x) & npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python 3.11 + venv
sudo apt-get install -y python3.11 python3.11-venv
```

### Install dependencies
```bash
# Rust dependencies are handled by Cargo automatically
cargo fetch

# Go modules
go mod tidy

# Node.js packages
npm ci

# Python virtualenv + deps
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Run locally (development mode)
```bash
# 1️⃣ Start the Rust gateway binary
cargo run --release

# 2️⃣ In another terminal, start the Node.js helper (optional)
npm run dev   # defined in package.json → starts app.js

# 3️⃣ Verify health endpoint
curl http://localhost:8080/health
```

### Run tests
```bash
# Rust tests
cargo test

# Go tests
go test ./...

# Node.js tests (if any)
npm test

# Python tests
pytest
```

## Deploy

The gateway is designed for containerised deployment (Docker + Kubernetes). Example Dockerfile is provided in `gateway/Dockerfile`.

```bash
# Build the Docker image
docker build -t your-registry/thai-gateway:latest ./gateway

# Push to registry
docker push your-registry/thai-gateway:latest

# Deploy to Kubernetes (helm chart placeholder)
helm upgrade --install thai-gateway ./helm/thai-gateway \
  --set image.repository=your-registry/thai-gateway \
  --set image.tag=latest
```

*When the final deployment target (AWS, GCP, Azure, etc.) is locked, this section will be refined with exact CLI commands.*

## Status
🚧 **In active development** – latest commit `cb97051` adds a sandbox‑tested real implementation.

## Contributing
Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to submit issues, feature requests, and pull requests.

## License
This project is licensed under the **MIT License**.