#[cfg(test)]
mod translation_unit {
    use super::*;
    use std::time::Instant;

    #[test]
    fn detects_english_language() {
        let prompt = "Hello world";
        assert_eq!(detect_language(prompt), Language::En);
    }

    #[test]
    fn skips_translation_for_non_english() {
        let thai = "สวัสดีโลก";
        assert_eq!(detect_language(thai), Language::Th);
        // translation function should be a no‑op
        assert_eq!(maybe_translate(thai), thai);
    }

    #[test]
    fn translation_latency_within_budget() {
        let eng = "Explain quantum computing in simple terms.";
        let start = Instant::now();
        let _ = translate_with_local_model(eng);
        let elapsed = start.elapsed();
        assert!(elapsed.as_millis() <= 200, "latency {}ms > 200ms", elapsed.as_millis());
    }

    #[test]
    fn audit_log_contains_original_prompt() {
        let eng = "Test prompt";
        let (translated, log_entry) = translate_and_log(eng);
        assert_eq!(log_entry.original, eng);
        assert_eq!(log_entry.translated, translated);
    }

    #[test]
    fn translation_error_results_in_502() {
        // mock a failing model
        let _ = set_translation_model_failure(true);
        let resp = handle_request("Fail me".to_string());
        assert_eq!(resp.status, 502);
        assert!(resp.audit_log.contains(&AuditEvent::TranslationFailed));
    }
}