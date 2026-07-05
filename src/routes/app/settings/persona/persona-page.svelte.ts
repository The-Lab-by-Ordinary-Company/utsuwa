import { personaStore } from '$lib/stores/persona.svelte';
import { characterStore } from '$lib/stores/character.svelte';
import { vrmStore } from '$lib/stores/vrm.svelte';
import { modulesStore } from '$lib/stores/modules.svelte';
import { settingsStore } from '$lib/stores/settings.svelte';
import { getLLMProvider, getTTSProvider } from '$lib/services/providers/registry';
import { allEvents } from '$lib/data/events';
import type { CompletedEventRecord, EventType } from '$lib/types/events';
import {
	fetchModels,
	getCachedModelsForProvider,
	debounce,
	type ModelInfo
} from '$lib/services/providers/use-model-fetch';

// Achievement data with event definitions joined
export interface Achievement {
	id: string;
	name: string;
	type: EventType;
	completedAt: Date;
}

// Shared state for the persona settings page. Created once by +page.svelte and
// passed to the section components via props. Effects stay in the page.
export function createPersonaPageState() {
	// Character state - single companion system
	const charState = $derived.by(() => characterStore.state);
	const moodInfo = $derived.by(() => characterStore.moodInfo);
	const stageInfo = $derived.by(() => characterStore.stageInfo);
	const affectionPercent = $derived.by(() => characterStore.affectionPercent);
	const isCharacterLoading = $derived.by(() => characterStore.isLoading);
	const appMode = $derived.by(() => characterStore.appMode);
	const isDatingSimMode = $derived.by(() => characterStore.appMode === 'dating_sim');

	// Completed events with full records (includes dates)
	let completedEventRecords = $state<CompletedEventRecord[]>([]);

	const achievements = $derived.by(() => {
		return completedEventRecords
			.map(record => {
				const eventDef = allEvents.find(e => e.id === record.eventId);
				if (!eventDef) return null;
				return {
					id: record.eventId,
					name: eventDef.name,
					type: eventDef.type,
					completedAt: record.completedAt
				} as Achievement;
			})
			.filter((a): a is Achievement => a !== null)
			.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
	});

	// Color and icon config for achievement types
	const achievementConfig: Record<EventType, { color: string; bgColor: string; icon: string; label: string }> = {
		milestone: { color: 'var(--ctp-yellow)', bgColor: 'var(--ctp-yellow)', icon: 'trophy', label: 'Milestone' },
		anniversary: { color: 'var(--ctp-pink)', bgColor: 'var(--ctp-pink)', icon: 'heart', label: 'Anniversary' },
		conditional: { color: 'var(--ctp-mauve)', bgColor: 'var(--ctp-mauve)', icon: 'award', label: 'Unlocked' },
		random: { color: 'var(--ctp-teal)', bgColor: 'var(--ctp-teal)', icon: 'sparkles', label: 'Surprise' },
		scheduled: { color: 'var(--ctp-blue)', bgColor: 'var(--ctp-blue)', icon: 'calendar', label: 'Event' }
	};

	function formatAchievementDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	// Persona form state
	let formName = $state('');
	let formSystemPrompt = $state('');
	let personalityExpanded = $state(false);
	let aiServicesExpanded = $state(false);
	let eventsExpanded = $state(false);
	let uploadModalOpen = $state(false);
	let modeConfirmOpen = $state(false);
	let pendingMode = $state<'companion' | 'dating_sim' | null>(null);

	// AI Services state
	const consciousnessSettings = $derived(modulesStore.getModuleSettings('consciousness'));
	const speechSettings = $derived(modulesStore.getModuleSettings('speech'));
	const isLLMEnabled = $derived.by(() => modulesStore.isModuleEnabled('consciousness'));
	const isTTSEnabled = $derived.by(() => modulesStore.isModuleEnabled('speech'));

	// Dynamic model fetching state for LLM
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

	// Use dynamic models if available, otherwise static
	const llmModels = $derived(llmDynamicModels ?? staticLLMModels);

	// Check if API key is present for current LLM provider
	const llmHasApiKey = $derived.by(() => {
		const providerId = consciousnessSettings.activeProvider as string;
		if (!providerId) return false;
		const provider = getLLMProvider(providerId);
		if (!provider) return false;
		if (provider.isLocal || !provider.requiresApiKey) return true;
		const config = settingsStore.getProviderConfig(providerId);
		return !!config.apiKey;
	});

	const staticTTSModels = $derived.by(() => {
		const providerId = speechSettings.activeProvider as string;
		if (!providerId) return [];
		const provider = getTTSProvider(providerId);
		return provider?.models ?? [];
	});

	// Dynamic model fetching state for TTS
	let ttsIsLoading = $state(false);
	let ttsFetchError = $state<string | null>(null);
	let ttsDynamicModels = $state<ModelInfo[] | null>(null);

	// Use dynamic models if available, otherwise static
	const ttsModels = $derived(ttsDynamicModels ?? staticTTSModels);

	// Check if API key is present for current TTS provider
	const ttsHasApiKey = $derived.by(() => {
		const providerId = speechSettings.activeProvider as string;
		if (!providerId) return false;
		const provider = getTTSProvider(providerId);
		if (!provider) return false;
		if (provider.isLocal || !provider.requiresApiKey) return true;
		const config = settingsStore.getProviderConfig(providerId);
		return !!config.apiKey;
	});

	// Fetch LLM models from provider API
	async function fetchLLMModels() {
		const targetProvider = consciousnessSettings.activeProvider as string;
		if (!targetProvider) return;
		const provider = getLLMProvider(targetProvider);
		if (!provider) return;

		const config = settingsStore.getProviderConfig(provider.id);

		await fetchModels({
			providerId: provider.id,
			apiKey: config.apiKey ?? '',
			// Fixed cloud providers always use their official default URL to avoid
			// stale proxy/baseUrl values. Custom endpoints and local providers respect
			// the user-supplied base URL (falling back to the provider default).
			baseUrl: provider.custom || provider.isLocal
				? (config.baseUrl || provider.defaultBaseUrl)
				: provider.defaultBaseUrl,
			isLocal: provider.isLocal,
			getCurrentProviderId: () => consciousnessSettings.activeProvider as string,
			onStart: () => {
				llmIsLoading = true;
				llmFetchError = null;
			},
			onSuccess: (models) => {
				llmIsLoading = false;
				llmDynamicModels = models;
				// Auto-select first model if none selected or current selection not in list
				const currentModel = consciousnessSettings.activeModel as string;
				const modelExists = models.some(m => m.id === currentModel);
				if (!currentModel || !modelExists) {
					modulesStore.setModuleSetting('consciousness', 'activeModel', models[0].id);
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

	// Fetch TTS models from provider API
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
				// Auto-select first model if none selected or current selection not in list
				const currentModel = speechSettings.activeModel as string;
				const modelExists = models.some(m => m.id === currentModel);
				if (!currentModel || !modelExists) {
					modulesStore.setModuleSetting('speech', 'activeModel', models[0].id);
				}
			},
			onError: () => {
				ttsIsLoading = false;
				ttsFetchError = 'Using default list';
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

	// Debounced fetch to avoid rapid API calls
	const debouncedFetchLLMModels = debounce(fetchLLMModels, 300);
	const debouncedFetchTTSModels = debounce(fetchTTSModels, 300);

	function saveName() {
		personaStore.updateCard({ name: formName.trim() || 'Utsuwa' });
	}

	function saveSystemPrompt() {
		personaStore.updateCard({ systemPrompt: formSystemPrompt });
	}

	// AI Services handlers
	function handleLLMProviderChange(providerId: string) {
		modulesStore.setModuleSetting('consciousness', 'activeProvider', providerId);
		const provider = getLLMProvider(providerId);

		// Reset dynamic models when provider changes
		llmDynamicModels = null;
		llmFetchError = null;
		llmIsLoading = false;

		// Check for cached models
		const cached = getCachedModelsForProvider(providerId);
		if (cached) {
			llmDynamicModels = cached;
		}

		if (provider && !provider.isLocal && provider.models?.length) {
			modulesStore.setModuleSetting('consciousness', 'activeModel', provider.models[0].id);
		}
		// Custom endpoints have no preset models; clear any stale selection so the
		// manual model field starts empty.
		if (provider?.custom) {
			modulesStore.setModuleSetting('consciousness', 'activeModel', '');
		}
		// Mark local providers as added immediately (they don't need API keys)
		if (provider?.isLocal || !provider?.requiresApiKey) {
			settingsStore.markProviderAdded(providerId);
		}
	}

	function handleLLMModelChange(modelId: string) {
		modulesStore.setModuleSetting('consciousness', 'activeModel', modelId);
	}

	const contextSizeSteps = [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072];

	function formatContextSize(value: number): string {
		if (value >= 1024) return `${value / 1024}k`;
		return String(value);
	}

	function handleContextSizeChange(value: number) {
		modulesStore.setModuleSetting('consciousness', 'contextSize', value);
	}

	function handleLLMNumberSetting(key: string, value: number | undefined) {
		if (value !== undefined && Number.isNaN(value)) return;
		modulesStore.setModuleSetting('consciousness', key, value);
	}

	function handleLLMBaseUrlChange(providerId: string, baseUrl: string) {
		settingsStore.setProviderConfig(providerId, { baseUrl });
		llmFetchError = null;
	}

	function handleTTSProviderChange(providerId: string) {
		modulesStore.setModuleSetting('speech', 'activeProvider', providerId);
		const provider = getTTSProvider(providerId);

		// Reset dynamic models when provider changes
		ttsDynamicModels = null;
		ttsFetchError = null;
		ttsIsLoading = false;

		// Check for cached models
		const cached = getCachedModelsForProvider(providerId);
		if (cached) {
			ttsDynamicModels = cached;
		}

		if (provider?.models?.length) {
			modulesStore.setModuleSetting('speech', 'activeModel', provider.models[0].id);
		}
		// Local providers ship a default voice so requests work before the user picks one
		if (provider?.isLocal && provider.voices?.length) {
			modulesStore.setModuleSetting('speech', 'activeVoiceId', provider.voices[0].id);
		}
		// Mark local providers as added immediately (they don't need API keys)
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

	function handleApiKeyChange(providerId: string, apiKey: string, type: 'llm' | 'tts') {
		// Clear error when user types
		if (type === 'llm') llmFetchError = null;
		if (type === 'tts') ttsFetchError = null;

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

	function toggleTTS() {
		modulesStore.setModuleEnabled('speech', !isTTSEnabled);
	}

	async function handleUpload(file: File) {
		await vrmStore.addModel(file);
		uploadModalOpen = false;
	}

	function requestModeChange(mode: 'companion' | 'dating_sim') {
		if (mode === appMode) return;
		pendingMode = mode;
		modeConfirmOpen = true;
	}

	function confirmModeChange() {
		if (pendingMode) {
			characterStore.setAppMode(pendingMode);
		}
		modeConfirmOpen = false;
		pendingMode = null;
	}

	function cancelModeChange() {
		modeConfirmOpen = false;
		pendingMode = null;
	}

	return {
		// Getters
		get charState() {
			return charState;
		},
		get moodInfo() {
			return moodInfo;
		},
		get stageInfo() {
			return stageInfo;
		},
		get affectionPercent() {
			return affectionPercent;
		},
		get isCharacterLoading() {
			return isCharacterLoading;
		},
		get appMode() {
			return appMode;
		},
		get isDatingSimMode() {
			return isDatingSimMode;
		},
		get completedEventRecords() {
			return completedEventRecords;
		},
		set completedEventRecords(value: CompletedEventRecord[]) {
			completedEventRecords = value;
		},
		get achievements() {
			return achievements;
		},
		get formName() {
			return formName;
		},
		set formName(value: string) {
			formName = value;
		},
		get formSystemPrompt() {
			return formSystemPrompt;
		},
		set formSystemPrompt(value: string) {
			formSystemPrompt = value;
		},
		get personalityExpanded() {
			return personalityExpanded;
		},
		set personalityExpanded(value: boolean) {
			personalityExpanded = value;
		},
		get aiServicesExpanded() {
			return aiServicesExpanded;
		},
		set aiServicesExpanded(value: boolean) {
			aiServicesExpanded = value;
		},
		get eventsExpanded() {
			return eventsExpanded;
		},
		set eventsExpanded(value: boolean) {
			eventsExpanded = value;
		},
		get uploadModalOpen() {
			return uploadModalOpen;
		},
		set uploadModalOpen(value: boolean) {
			uploadModalOpen = value;
		},
		get modeConfirmOpen() {
			return modeConfirmOpen;
		},
		get consciousnessSettings() {
			return consciousnessSettings;
		},
		get speechSettings() {
			return speechSettings;
		},
		get isLLMEnabled() {
			return isLLMEnabled;
		},
		get isTTSEnabled() {
			return isTTSEnabled;
		},
		get llmIsLoading() {
			return llmIsLoading;
		},
		get llmFetchError() {
			return llmFetchError;
		},
		get lastLocalLLMFetchKey() {
			return lastLocalLLMFetchKey;
		},
		set lastLocalLLMFetchKey(value: string) {
			lastLocalLLMFetchKey = value;
		},
		get llmModels() {
			return llmModels;
		},
		get llmHasApiKey() {
			return llmHasApiKey;
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

		// Constants
		achievementConfig,
		contextSizeSteps,

		// Actions
		formatAchievementDate,
		formatContextSize,
		fetchLLMModels,
		fetchTTSModels,
		debouncedFetchLLMModels,
		saveName,
		saveSystemPrompt,
		handleLLMProviderChange,
		handleLLMModelChange,
		handleContextSizeChange,
		handleLLMNumberSetting,
		handleLLMBaseUrlChange,
		handleTTSProviderChange,
		handleTTSModelChange,
		handleTTSVoiceChange,
		handleTTSApiKeyBlur,
		handleApiKeyChange,
		handleLLMApiKeyBlur,
		toggleLLM,
		toggleTTS,
		handleUpload,
		requestModeChange,
		confirmModeChange,
		cancelModeChange
	};
}

export type PersonaPageState = ReturnType<typeof createPersonaPageState>;
