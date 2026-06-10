#[derive(Serialize, Deserialize)]
pub struct ProviderConfig {
    pub url: String,
    pub api_key: String,
}

#[derive(Serialize, Deserialize)]
pub struct Config {
    pub providers: Vec<ProviderConfig>,
}