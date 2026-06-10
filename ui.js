function renderProviderList(providers) {
    providers.forEach(provider => {
        const listItem = document.createElement('li');
        listItem.textContent = provider.name;

        const toggle = document.createElement('input');
        toggle.type = 'checkbox';
        toggle.checked = provider.translate_enabled;
        toggle.addEventListener('change', () => {
            updateProviderTranslationStatus(provider.id, toggle.checked);
        });

        if (provider.thai_supported) {
            const message = document.createElement('span');
            message.textContent = 'This provider already supports Thai.';
            listItem.appendChild(message);
        }

        listItem.appendChild(toggle);
        providerList.appendChild(listItem);
    });
}