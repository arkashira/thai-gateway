# 🛠️ thai-gateway

<div align="center">
  <a href="https://shields.io/">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT">
  </a>
  <a href="https://shields.io/">
    <img src="https://img.shields.io/badge/Language-Rust-blue.svg" alt="Language: Rust">
  </a>
  <a href="https://shields.io/">
    <img src="https://img.shields.io/badge/Build- Cargo-blue.svg" alt="Build: Cargo">
  </a>
  <a href="https://shields.io/">
    <img src="https://img.shields.io/badge/Stars-0-blue.svg" alt="Stars: 0">
  </a>
</div>

---

# 🚀 thai-gateway

**Power businesses with seamless Thai API integrations.** thai-gateway is a multi-API rate balancing service that distributes AI requests across providers to avoid quota exhaustion and reduce costs by 30–50% (est. $2K–$10K/month savings for mid-sized platforms).

## Why thai-gateway?

* **Avoid quota exhaustion**: Distribute AI requests across multiple providers to prevent quota exhaustion.
* **Reduce costs**: Save up to 50% on AI request costs by balancing across providers.
* **Seamless integrations**: Easily integrate with multiple AI providers, including OpenRouter, Mistral, and Anthropic.
* **Scalable**: Handle high volumes of AI requests with ease.
* **Flexible**: Configure provider weights and quotas to suit your business needs.

## Feature Overview

| Feature | Description |
| --- | --- |
| Multi-API rate balancing | Distributes AI requests across multiple providers to avoid quota exhaustion and reduce costs. |
| Provider weights and quotas | Configure provider weights and quotas to suit your business needs. |
| Real-time metrics | Monitor AI request performance and costs in real-time. |
| Scalable architecture | Handle high volumes of AI requests with ease. |

## Tech Stack

* Rust
* Cargo
* Rustfmt
* Clippy
* Rustdoc

## Project Structure

```markdown
thai-gateway/
app/
business/
gateway/
src/
tests/
README.md
ai.rs
app.js
base.py
env.js
health.rs
healthCheck.js
logger.js
main.rs
metrics.js
middleware.go
migration.sql
provider.js
provider_model.go
provider_model_test.go
router.js
ui.js
```

## Getting Started

1. Install Rust and Cargo:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```
2. Clone the repository:
```bash
git clone https://github.com/axentx/thai-gateway.git
```
3. Build the project:
```bash
cargo build
```
4. Run the project:
```bash
cargo run
```

## Deploy

1. Build the project:
```bash
cargo build --release
```
2. Deploy to your preferred platform (e.g., Docker, Kubernetes).

## Status

Last updated: 2023-02-20
Recent commit: db6ea45 axentx-dev-bot: feature cycle 20260602-182749-thai-gat

## Contributing

Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on contributing to this project.

## License

thai-gateway is licensed under the MIT License.