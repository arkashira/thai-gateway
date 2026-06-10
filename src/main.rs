// metrics.rs
#[cfg(test)]
mod tests {
    use super::*;
    use prometheus::TextEncoder;

    #[test]
    fn test_metrics_registration() {
        let registry = prometheus::default_registry().clone();
        assert!(registry.get_metric_family(&"provider_usage_total".to_string()).is_some());
        assert!(registry.get_metric_family(&"provider_latency_seconds".to_string()).is_some());
        assert!(registry.get_metric_family(&"provider_error_total".to_string()).is_some());
    }

    #[test]
    fn test_metrics_format() {
        let registry = prometheus::default_registry().clone();
        let encoder = TextEncoder::new();
        let metric_families = registry.gather();
        let mut buffer = Vec::new();
        encoder.encode(&metric_families, &mut buffer).unwrap();
        let metrics = String::from_utf8(buffer).unwrap();
        assert!(metrics.contains("provider_usage_total"));
        assert!(metrics.contains("provider_latency_seconds"));
        assert!(metrics.contains("provider_error_total"));
    }
}