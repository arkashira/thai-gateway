type Provider struct {
    ID               int    `json:"id"`
    Name             string `json:"name"`
    ThaiSupported    bool   `json:"thai_supported"`
    TranslateEnabled bool   `json:"translate_enabled"`
}

func (p *Provider) Validate() error {
    if p.ThaiSupported && p.TranslateEnabled {
        return errors.New("Thai-supported providers cannot have translation enabled")
    }
    return nil
}