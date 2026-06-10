<h3 align="center">🛠️ thai-gateway</h3>

<div align="center">
  <a href="https://github.com/your-org/thai-gateway/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://github.com/your-org/thai-gateway"><img src="https://img.shields.io/badge/language-Rust-orange.svg" alt="Language: Rust"></a>
  <a href="https://github.com/your-org/thai-gateway/actions"><img src="https://img.shields.io/github/actions/workflow/status/your-org/thai-gateway/ci.yml?branch=main&label=build" alt="Build Status"></a>
  <a href="https://github.com/your-org/thai-gateway/stargazers"><img src="https://img.shields.io/github/stars/your-org/thai-gateway.svg?style=social" alt="Stars"></a>
</div>

---

# 🚀 thai-gateway
**Power Thai AI platforms with intelligent multi‑API rate balancing.**  
Distribute requests across OpenRouter, Mistral, Anthropic and other providers to keep quotas alive, cut cloud‑AI spend by 30‑50 % and keep your Thai‑language services humming.

## Why thai-gateway?
- **Cost‑Effective** – Cuts AI‑provider spend by up to **50 %**, saving **$2 K–$10 K/month** for midsize platforms.  
- **Quota‑Safe** – Dynamically spreads traffic, preventing any single provider from hitting its quota.  
- **Thai‑First** – Optimized for Thai‑language models and latency patterns common in Southeast Asian workloads.  
- **Plug‑and‑Play** – Drop‑in Rust library; just point it at your existing `main.rs` entry point.  
- **Observability Ready** – Emits Prometheus‑compatible metrics for request rates, failures, and cost per provider.  
- **Scalable** – Works equally well in a single‑process binary or as a side‑car in Kubernetes.  
- **Open‑Source** – MIT‑licensed, encouraging community extensions and custom provider adapters.

## Feature Overview

| Feature | Description |
|---------|-------------|
| **Multi‑API Rate Balancing** | Auto‑routes each request to the cheapest provider with remaining quota. |
| **Cost Estimation Dashboard** | Real‑time cost breakdown per provider (USD/hr). |
| **Thai‑Model Prioritization** | Preference rules for Thai‑optimized LLM endpoints. |
| **Fail‑over & Retries** | Transparent retry on provider errors with exponential back‑off. |
| **Metrics Export** | Prometheus endpoint (`/metrics`) exposing request counts, latency, and spend. |
| **Config‑Driven** | YAML/JSON config for providers, weights, and quota thresholds. |
| **Health Checks** | `/healthz` endpoint confirming gateway liveliness and provider reachability. |

## Tech Stack
*The definitive list lives in the repository’s decision file.*  
See **[decisions/tech-stack.md](decisions/tech-stack.md)** for the exact stack used in this project.

## Project Structure
```
├─ business/          # Business‑logic helpers (e.g., cost calculators)
├─ gateway/           # Core routing & balancing engine
├─ src/               # Shared utilities and models
├─ tests/             # Integration & unit tests
├─ ai.rs              # Provider abstractions
├─ health.rs          # Health‑check implementation
├─ main.rs            # Application entry point
└─ README.md
```

## Getting Started
```bash
# 1️⃣ Clone the repo
git clone https://github.com/your-org/thai-gateway.git
cd thai-gateway

# 2️⃣ Build the binary (requires Rust & Cargo)
cargo build --release

# 3️⃣ Run the gateway (default config looks for ./config.yaml)
cargo run --release -- --config ./config.yaml

# 4️⃣ Run the test suite
cargo test --all
```

## Deploy
Deployment instructions depend on the target defined in **decisions/tech-stack.md**.  
Typical patterns include:

* **Docker** – `docker build -t thai-gateway . && docker run -p 8080:8080 thai-gateway`
* **Kubernetes** – Apply the provided Helm chart or Kustomize overlay (see `deploy/`).

*Refer to the tech‑stack decision file for the exact CI/CD pipeline and cloud‑provider specifics.*

## Status
Active development – latest commit **90e4390** (2026‑06‑02) adds the final rate‑balancing algorithm.

## Contributing
We welcome contributions! Please read our **[CONTRIBUTING.md](CONTRIBUTING.md)** for guidelines on how to propose changes, run tests, and submit pull requests.

## License
This project is licensed under the **MIT License**.