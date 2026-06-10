func TranslationMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        providerID := getProviderIDFromRequest(r)
        provider, err := GetProviderByID(providerID)
        if err != nil {
            http.Error(w, "Failed to get provider", http.StatusInternalServerError)
            return
        }

        if !provider.TranslateEnabled {
            next.ServeHTTP(w, r)
            return
        }

        // Perform translation logic here
        translatedRequest := translateRequest(r)
        next.ServeHTTP(w, translatedRequest)
    })
}