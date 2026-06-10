use axum::{extract::Json, http::StatusCode, routing::post, Router};
use serde::{Deserialize, Serialize};
use std::fs;
use std::time::Duration;
use tokio::time::sleep;

#[derive(Serialize, Deserialize)]
struct ProviderConfig {
    url: String,
    api_key: String,
}

#[derive(Serialize, Deserialize)]
struct Config {
    providers: Vec<ProviderConfig>,
}

async fn config_handler(Json(config): Json<Config>) -> Result<StatusCode, StatusCode> {
    // Verify provider health
    let mut healthy_providers = Vec::new();
    for provider in &config.providers {
        match verify_provider_health(&provider.url).await {
            Ok(_) => healthy_providers.push(provider.clone()),
            Err(_) => println!("Provider {} is unhealthy", provider.url),
        }
    }

    // Persist configuration
    let config_path = "config.json";
    fs::write(config_path, serde_json::to_string(&config).unwrap()).unwrap();

    Ok(StatusCode::OK)
}

async fn verify_provider_health(url: &str) -> Result<(), reqwest::Error> {
    let client = reqwest::Client::new();
    let response = client.get(url).timeout(Duration::from_secs(5)).send().await?;
    if response.status().is_success() {
        Ok(())
    } else {
        Err(reqwest::Error::new(reqwest::ErrorKind::InvalidResponse))
    }
}

pub fn config_router() -> Router {
    Router::new().route("/config", post(config_handler))
}