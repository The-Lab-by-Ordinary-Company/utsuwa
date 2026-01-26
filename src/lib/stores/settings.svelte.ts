import { browser } from '$app/environment';
import type { ProviderConfig } from '$lib/types';
import { LLM_PROVIDERS, TTS_PROVIDERS } from '$lib/services/providers/registry';

export type ProviderCategory = 'llm' | 'tts' | 'stt';

function createSettingsStore() {
	// Provider configurations (keyed by provider id)
	// This is the SINGLE SOURCE OF TRUTH for credentials
	let providerConfigs = $state<Record<string, ProviderConfig>>({});

	// Track which providers have been explicitly added by user
	let addedProviders = $state<Record<string, boolean>>({});

	// Load from localStorage on init
	if (browser) {
		const saved = localStorage.getItem('utsuwa-settings');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				providerConfigs = parsed.providerConfigs ?? {};
				addedProviders = parsed.addedProviders ?? {};

				// Migrate old settings format if needed
				if (parsed.anthropicApiKey && !providerConfigs.anthropic) {
					providerConfigs.anthropic = { apiKey: parsed.anthropicApiKey };
					addedProviders.anthropic = true;
				}
				if (parsed.openaiApiKey && !providerConfigs.openai) {
					providerConfigs.openai = { apiKey: parsed.openaiApiKey };
					addedProviders.openai = true;
				}
				if (parsed.elevenLabsApiKey && !providerConfigs.elevenlabs) {
					providerConfigs.elevenlabs = {
						apiKey: parsed.elevenLabsApiKey,
						voiceId: parsed.elevenLabsVoiceId
					};
					addedProviders.elevenlabs = true;
				}

				// Migrate old llmProvider/ttsProvider - mark them as added
				if (parsed.llmProvider && providerConfigs[parsed.llmProvider]?.apiKey) {
					addedProviders[parsed.llmProvider] = true;
				}
				if (parsed.ttsProvider && providerConfigs[parsed.ttsProvider]?.apiKey) {
					addedProviders[parsed.ttsProvider] = true;
				}
			} catch (e) {
				console.error('Failed to load settings:', e);
			}
		}
	}

	function save() {
		if (browser) {
			localStorage.setItem(
				'utsuwa-settings',
				JSON.stringify({
					providerConfigs,
					addedProviders
				})
			);
		}
	}

	// Provider configuration
	function setProviderConfig(providerId: string, config: Partial<ProviderConfig>) {
		providerConfigs[providerId] = {
			...providerConfigs[providerId],
			...config
		};
		save();
	}

	function getProviderConfig(providerId: string): ProviderConfig {
		return providerConfigs[providerId] ?? {};
	}

	// Mark a provider as added (user has explicitly added it to their setup)
	function markProviderAdded(providerId: string) {
		addedProviders[providerId] = true;
		save();
	}

	// Remove a provider from user's setup
	function removeProvider(providerId: string) {
		delete addedProviders[providerId];
		delete providerConfigs[providerId];
		save();
	}

	// Check if a provider has been added by user
	function isProviderAdded(providerId: string): boolean {
		return addedProviders[providerId] ?? false;
	}

	// Check if a provider is properly configured (has required credentials)
	function isProviderConfigured(providerId: string): boolean {
		const config = providerConfigs[providerId];
		if (!config) return false;

		// Find the provider metadata to check if it requires an API key
		const llmProvider = LLM_PROVIDERS.find((p) => p.id === providerId);
		const ttsProvider = TTS_PROVIDERS.find((p) => p.id === providerId);
		const provider = llmProvider || ttsProvider;

		if (!provider) return false;

		// Local providers don't require API keys
		if (provider.isLocal) return true;
		if (!provider.requiresApiKey) return true;

		// For providers that require API key, check if it's set
		return !!config.apiKey;
	}

	// Get all configured providers for a category
	function getConfiguredProviders(category: ProviderCategory): string[] {
		const providers = category === 'llm' ? LLM_PROVIDERS : TTS_PROVIDERS;
		// STT uses TTS provider list for now (many providers support both)

		return providers
			.filter((p) => {
				const isAdded = isProviderAdded(p.id);
				const isConfigured = isProviderConfigured(p.id);
				return isAdded && isConfigured;
			})
			.map((p) => p.id);
	}

	// Get all added providers (even if not fully configured)
	function getAddedProviders(category: ProviderCategory): string[] {
		const providers = category === 'llm' ? LLM_PROVIDERS : TTS_PROVIDERS;

		return providers.filter((p) => isProviderAdded(p.id)).map((p) => p.id);
	}

	// Legacy compatibility getters
	function getAnthropicApiKey(): string {
		return providerConfigs.anthropic?.apiKey ?? '';
	}

	function getOpenaiApiKey(): string {
		return providerConfigs.openai?.apiKey ?? '';
	}

	function getElevenLabsApiKey(): string {
		return providerConfigs.elevenlabs?.apiKey ?? '';
	}

	function getElevenLabsVoiceId(): string {
		return providerConfigs.elevenlabs?.voiceId ?? '';
	}

	// Legacy compatibility setters
	function setAnthropicApiKey(key: string) {
		setProviderConfig('anthropic', { apiKey: key });
		markProviderAdded('anthropic');
	}

	function setOpenaiApiKey(key: string) {
		setProviderConfig('openai', { apiKey: key });
		markProviderAdded('openai');
	}

	function setElevenLabsApiKey(key: string) {
		setProviderConfig('elevenlabs', { apiKey: key });
		markProviderAdded('elevenlabs');
	}

	function setElevenLabsVoiceId(id: string) {
		setProviderConfig('elevenlabs', { voiceId: id });
	}

	return {
		// Provider configs
		get providerConfigs() {
			return providerConfigs;
		},
		get addedProviders() {
			return addedProviders;
		},

		// Legacy compatibility getters
		get anthropicApiKey() {
			return getAnthropicApiKey();
		},
		get openaiApiKey() {
			return getOpenaiApiKey();
		},
		get elevenLabsApiKey() {
			return getElevenLabsApiKey();
		},
		get elevenLabsVoiceId() {
			return getElevenLabsVoiceId();
		},

		// Provider management
		setProviderConfig,
		getProviderConfig,
		markProviderAdded,
		removeProvider,
		isProviderAdded,
		isProviderConfigured,
		getConfiguredProviders,
		getAddedProviders,

		// Legacy compatibility setters
		setAnthropicApiKey,
		setOpenaiApiKey,
		setElevenLabsApiKey,
		setElevenLabsVoiceId
	};
}

export const settingsStore = createSettingsStore();
