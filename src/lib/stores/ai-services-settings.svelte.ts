import { modulesStore } from '$lib/stores/modules.svelte';
import { settingsStore } from '$lib/stores/settings.svelte';
import { getLLMProvider, getTTSProvider } from '$lib/services/providers/registry';
import { defaultVoiceForProvider } from '$lib/services/tts/provider-utils';
import {
	fetchModels,
	getCachedModelsForProvider,
	debounce,
	type ModelInfo
} from '$lib/services/providers/use-model-fetch';
import {
	selectDefaultModel,
	isProviderReadyForFetch,
	createFetchSignature
} from './ai-services-settings-logic.ts';

/**
 * Shared reactive state for the LLM settings page.
 * Extracted from the persona page so the same UI can live in the settings sidebar.
 */
export function createLlmSettingsState() {
	const consciousnessSettings = $derived(modulesStore.getModuleSettings('consciousness'));
	const isLLMEnabled = $derived.by(() => modulesStore.isModuleEnabled('consciousness'));

	let llmIsLoading = $state(false);
	let llmFetchError = $state<string | null>(null);
	let llmDynamicModels = $state<ModelInfo[] | null>(null);
	let lastLocalLLMFetchKey = $state('');

	const staticLLMModels = $derived.by(() => {
		const providerId = consciousnessSettings.activeProvider as string;
		if (!providerId) return [];
		const provider = getLLMProvider(providerId);
		return provider?.models ?? [];
	});

	const llmModels = $derived(llmDynamicModels ?? staticLLMModels);

	const llmHasApiKey = $derived.by(() => {
		const providerId = consciousnessSettings.activeProvider as string;
		if (!providerId) return false;
		const provider = getLLMProvider(providerId);
		if (!provider) return false;
		if (provider.isLocal || !provider.requiresApiKey) return true;
		const config = settingsStore.getProviderConfig(providerId);
		return !!config.apiKey;
	});

	async function fetchLLMModels(targetProvider = consciousnessSettings.activeProvider as string) {
		if (!targetProvider) return;
		const provider = getLLMProvider(targetProvider);
		if (!provider) return;

		const config = settingsStore.getProviderConfig(provider.id);
		if (!isProviderReadyForFetch(provider, config)) {
			llmDynamicModels = null;
			return;
		}

		const cached = getCachedModelsForProvider(provider.id);
		if (cached) {
			llmDynamicModels = cached;
			return;
		}

		await fetchModels({
			providerId: provider.id,
			apiKey: config.apiKey ?? '',
			baseUrl: config.baseUrl,
			isLocal: provider.isLocal,
			getCurrentProviderId: () => modulesStore.getModuleSettings('consciousness').activeProvider as string,
			onStart: () => {
				llmIsLoading = true;
				llmFetchError = null;
			},
			onSuccess: (models) => {
				llmIsLoading = false;
				llmDynamicModels = models;
				const currentModel = consciousnessSettings.activeModel as string;
				const nextModel = selectDefaultModel(models, currentModel);
				if (nextModel !== currentModel) {
					modulesStore.setModuleSetting('consciousness', 'activeModel', nextModel);
				}
			},
			onError: (error) => {
				llmIsLoading = false;
				llmFetchError = error ?? 'Could not fetch installed models';
				llmDynamicModels = provider.isLocal ? [] : null;
			},
			onEmpty: () => {
				llmIsLoading = false;
				llmFetchError = provider.isLocal
					? 'No installed models found. Pull a model, then refresh.'
					: null;
				llmDynamicModels = provider.isLocal ? [] : null;
			},
			onStale: () => {
				llmIsLoading = false;
			}
		});
	}

	const debouncedFetchLLMModels = debounce(fetchLLMModels, 300);

	function handleLLMProviderChange(providerId: string) {
		modulesStore.setModuleSetting('consciousness', 'activeProvider', providerId);
		const provider = getLLMProvider(providerId);

		llmDynamicModels = null;
		llmFetchError = null;
		llmIsLoading = false;

		const cached = getCachedModelsForProvider(providerId);
		if (cached) {
			llmDynamicModels = cached;
		}

		if (provider && !provider.isLocal && provider.models?.length) {
			modulesStore.setModuleSetting('consciousness', 'activeModel', provider.models[0].id);
		}

		if (provider?.custom) {
			modulesStore.setModuleSetting('consciousness', 'activeModel', '');
		}

		if (provider?.isLocal || !provider?.requiresApiKey) {
			settingsStore.markProviderAdded(providerId);
		}
	}

	function handleLLMNumberSetting(key: string, value: number | undefined) {
		if (value !== undefined && Number.isNaN(value)) return;
		modulesStore.setModuleSetting('consciousness', key, value);
	}

	function handleLLMModelChange(modelId: string) {
		modulesStore.setModuleSetting('consciousness', 'activeModel', modelId);
	}

	function handleLLMBaseUrlChange(providerId: string, baseUrl: string) {
		settingsStore.setProviderConfig(providerId, { baseUrl });
		llmFetchError = null;
	}

	function handleApiKeyChange(providerId: string, apiKey: string) {
		llmFetchError = null;
		settingsStore.setProviderConfig(providerId, { apiKey });
		if (apiKey) {
			settingsStore.markProviderAdded(providerId);
		}
	}

	function handleLLMApiKeyBlur() {
		const providerId = consciousnessSettings.activeProvider as string;
		if (!providerId) return;
		const provider = getLLMProvider(providerId);
		const config = settingsStore.getProviderConfig(providerId);
		if (config.apiKey && provider && !provider.isLocal) {
			debouncedFetchLLMModels();
		}
	}

	function toggleLLM() {
		modulesStore.setModuleEnabled('consciousness', !isLLMEnabled);
	}

	return {
		get consciousnessSettings() {
			return consciousnessSettings;
		},
		get isLLMEnabled() {
			return isLLMEnabled;
		},
		get llmIsLoading() {
			return llmIsLoading;
		},
		get llmFetchError() {
			return llmFetchError;
		},
		get llmModels() {
			return llmModels;
		},
		get llmHasApiKey() {
			return llmHasApiKey;
		},
		get lastLocalLLMFetchKey() {
			return lastLocalLLMFetchKey;
		},
		set lastLocalLLMFetchKey(value: string) {
			lastLocalLLMFetchKey = value;
		},
		fetchLLMModels,
		debouncedFetchLLMModels,
		handleLLMProviderChange,
		handleLLMNumberSetting,
		handleLLMModelChange,
		handleLLMBaseUrlChange,
		handleApiKeyChange,
		handleLLMApiKeyBlur,
		toggleLLM
	};
}

export type LlmSettingsState = ReturnType<typeof createLlmSettingsState>;

/**
 * Shared reactive state for the TTS settings page.
 */
export function createTtsSettingsState() {
	const speechSettings = $derived(modulesStore.getModuleSettings('speech'));
	const isTTSEnabled = $derived.by(() => modulesStore.isModuleEnabled('speech'));

	let ttsIsLoading = $state(false);
	let ttsFetchError = $state<string | null>(null);
	let ttsDynamicModels = $state<ModelInfo[] | null>(null);

	const staticTTSModels = $derived.by(() => {
		const providerId = speechSettings.activeProvider as string;
		if (!providerId) return [];
		const provider = getTTSProvider(providerId);
		return provider?.models ?? [];
	});

	const ttsModels = $derived(ttsDynamicModels ?? staticTTSModels);

	const ttsHasApiKey = $derived.by(() => {
		const providerId = speechSettings.activeProvider as string;
		if (!providerId) return false;
		const provider = getTTSProvider(providerId);
		if (!provider) return false;
		if (provider.isLocal || !provider.requiresApiKey) return true;
		const config = settingsStore.getProviderConfig(providerId);
		return !!config.apiKey;
	});

	async function fetchTTSModels() {
		const targetProvider = speechSettings.activeProvider as string;
		if (!targetProvider) return;
		const provider = getTTSProvider(targetProvider);
		if (!provider) return;

		const config = settingsStore.getProviderConfig(provider.id);

		await fetchModels({
			providerId: provider.id,
			apiKey: config.apiKey ?? '',
			baseUrl: config.baseUrl,
			isLocal: provider.isLocal,
			getCurrentProviderId: () => speechSettings.activeProvider as string,
			onStart: () => {
				ttsIsLoading = true;
				ttsFetchError = null;
			},
			onSuccess: (models) => {
				ttsIsLoading = false;
				ttsDynamicModels = models;
				const currentModel = speechSettings.activeModel as string;
				const nextModel = selectDefaultModel(models, currentModel);
				if (nextModel !== currentModel) {
					modulesStore.setModuleSetting('speech', 'activeModel', nextModel);
				}
			},
			onError: (error) => {
				ttsIsLoading = false;
				ttsFetchError = error ?? 'Using default list';
				ttsDynamicModels = null;
			},
			onEmpty: () => {
				ttsIsLoading = false;
				ttsDynamicModels = null;
			},
			onStale: () => {
				ttsIsLoading = false;
			}
		});
	}

	const debouncedFetchTTSModels = debounce(fetchTTSModels, 300);

	function handleTTSProviderChange(providerId: string) {
		modulesStore.setModuleSetting('speech', 'activeProvider', providerId);
		const provider = getTTSProvider(providerId);

		ttsDynamicModels = null;
		ttsFetchError = null;
		ttsIsLoading = false;

		const cached = getCachedModelsForProvider(providerId);
		if (cached) {
			ttsDynamicModels = cached;
		}

		if (provider?.models?.length) {
			modulesStore.setModuleSetting('speech', 'activeModel', provider.models[0].id);
		}

		modulesStore.setModuleSetting('speech', 'activeVoiceId', defaultVoiceForProvider(provider));

		if (provider?.isLocal || !provider?.requiresApiKey) {
			settingsStore.markProviderAdded(providerId);
		}
	}

	function handleTTSModelChange(modelId: string) {
		modulesStore.setModuleSetting('speech', 'activeModel', modelId);
	}

	function handleTTSVoiceChange(voiceId: string) {
		modulesStore.setModuleSetting('speech', 'activeVoiceId', voiceId);
	}

	function handleTTSApiKeyBlur() {
		const providerId = speechSettings.activeProvider as string;
		if (!providerId) return;
		const provider = getTTSProvider(providerId);
		const config = settingsStore.getProviderConfig(providerId);
		if (config.apiKey && provider && !provider.isLocal) {
			debouncedFetchTTSModels();
		}
	}

	function handleApiKeyChange(providerId: string, apiKey: string) {
		ttsFetchError = null;
		settingsStore.setProviderConfig(providerId, { apiKey });
		if (apiKey) {
			settingsStore.markProviderAdded(providerId);
		}
	}

	function toggleTTS() {
		modulesStore.setModuleEnabled('speech', !isTTSEnabled);
	}

	return {
		get speechSettings() {
			return speechSettings;
		},
		get isTTSEnabled() {
			return isTTSEnabled;
		},
		get ttsIsLoading() {
			return ttsIsLoading;
		},
		get ttsFetchError() {
			return ttsFetchError;
		},
		get ttsModels() {
			return ttsModels;
		},
		get ttsHasApiKey() {
			return ttsHasApiKey;
		},
		fetchTTSModels,
		debouncedFetchTTSModels,
		handleTTSProviderChange,
		handleTTSModelChange,
		handleTTSVoiceChange,
		handleTTSApiKeyBlur,
		handleApiKeyChange,
		toggleTTS
	};
}

export type TtsSettingsState = ReturnType<typeof createTtsSettingsState>;
