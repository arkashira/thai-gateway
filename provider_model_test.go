func TestProviderModel_TranslateEnabled(t *testing.T) {
    p := &Provider{TranslateEnabled: true}
    if !p.TranslateEnabled {
        t.Errorf("Expected TranslateEnabled to be true")
    }

    p.TranslateEnabled = false
    if p.TranslateEnabled {
        t.Errorf("Expected TranslateEnabled to be false")
    }
}

func TestProviderModel_Validation(t *testing.T) {
    p := &Provider{
        ThaiSupported:    true,
        TranslateEnabled: true,
    }
    err := p.Validate()
    if err == nil {
        t.Errorf("Expected validation error for Thai-supported provider with translation enabled")
    }
}