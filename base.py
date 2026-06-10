import pytest

@pytest.fixture
def provider_factory():
    return ProviderFactory()

def test_add_provider(provider_factory):
    # Arrange
    config_file = 'providers.yaml'
    provider_name = 'new_provider'

    # Act
    providers = provider_factory.load_providers(config_file)

    # Assert
    assert provider_name in [p.name for p in providers]

def test_remove_provider(provider_factory):
    # Arrange
    config_file = 'providers.yaml'
    provider_name = 'removed_provider'

    # Act
    providers = provider_factory.load_providers(config_file)

    # Assert
    assert provider_name not in [p.name for p in providers]

def test_invalid_config_file(provider_factory):
    # Arrange
    config_file = 'invalid_providers.yaml'

    # Act and Assert
    with pytest.raises(Exception):
        provider_factory.load_providers(config_file)