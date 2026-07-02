<script lang="ts">
	import { pop, fadeFast, slideOpen } from '$lib/utils/motion';
	import { personaStore } from '$lib/stores/persona.svelte';
	import { characterStore } from '$lib/stores/character.svelte';
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import { modulesStore } from '$lib/stores/modules.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { getLLMProvider, getTTSProvider } from '$lib/services/providers/registry';

	import { Icon, Progress, Tooltip, ProviderDropdown, ModelDropdown } from '$lib/components/ui';
	import VrmUploader from '$lib/components/vrm/VrmUploader.svelte';
	import { allEvents } from '$lib/data/events';
	import { getCompletedEvents } from '$lib/services/storage/events';
	import type { CompletedEventRecord, EventType } from '$lib/types/events';
	import {
		fetchModels,
		getCachedModelsForProvider,
		debounce,
		type ModelInfo
	} from '$lib/services/providers/use-model-fetch';

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

	// Load completed events from database
	$effect(() => {
		if (isDatingSimMode) {
			getCompletedEvents().then(records => {
				completedEventRecords = records;
			});
		}
	});

	// Achievement data with event definitions joined
	interface Achievement {
		id: string;
		name: string;
		type: EventType;
		completedAt: Date;
	}

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
			baseUrl: config.baseUrl,
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

	$effect(() => {
		const providerId = consciousnessSettings.activeProvider as string;
		const provider = providerId ? getLLMProvider(providerId) : null;
		if (!provider?.isLocal) {
			lastLocalLLMFetchKey = '';
			return;
		}

		const baseUrl = settingsStore.getProviderConfig(provider.id).baseUrl ?? provider.defaultBaseUrl ?? '';
		const fetchKey = `${provider.id}:${baseUrl}`;

		if (fetchKey !== lastLocalLLMFetchKey) {
			lastLocalLLMFetchKey = fetchKey;
			debouncedFetchLLMModels();
		}
	});

	// Load form values from store when character is ready
	$effect(() => {
		if (characterStore.isReady) {
			formName = personaStore.name;
			formSystemPrompt = personaStore.systemPrompt;
		}
	});

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
		// Mark local providers as added immediately (they don't need API keys)
		if (provider?.isLocal || !provider?.requiresApiKey) {
			settingsStore.markProviderAdded(providerId);
		}
	}

	function handleLLMModelChange(modelId: string) {
		modulesStore.setModuleSetting('consciousness', 'activeModel', modelId);
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
</script>

<div class="character-screen">
	<!-- Header -->
	<header class="screen-header">
		<input
			type="text"
			class="name-input"
			bind:value={formName}
			placeholder="Character Name"
			onblur={saveName}
		/>
	</header>

	<!-- Main Content -->
	<div class="main-content">
		<!-- Left Panel: Character Preview -->
		<div class="character-panel">
			<!-- App Mode Toggle -->
			<div class="mode-section">
				<span class="section-label">App Mode</span>
				<div class="mode-toggle">
					<button
						class="mode-option"
						class:active={appMode === 'companion'}
						onclick={() => requestModeChange('companion')}
					>
						<Icon name="sparkles" size={14} />
						Companion
					</button>
					<button
						class="mode-option"
						class:active={appMode === 'dating_sim'}
						onclick={() => requestModeChange('dating_sim')}
					>
						<Icon name="heart" size={14} />
						Dating Sim
					</button>
				</div>
			</div>

			<!-- Model Gallery (inline) -->
			<div class="model-gallery">
				<div class="gallery-header">
					<span class="gallery-label">Avatar</span>
					<button class="upload-btn" onclick={() => uploadModalOpen = true}>
						<Icon name="upload" size={14} />
						<span>Add Custom</span>
					</button>
				</div>

				<div class="gallery-grid">
					{#each vrmStore.models as model (model.id)}
						<button
							class="model-card"
							class:active={model.id === vrmStore.activeModelId}
							onclick={() => vrmStore.setActiveModel(model.id)}
						>
							<div class="model-preview">
								{#if model.previewUrl}
									<img src={model.previewUrl} alt={model.name} />
								{:else}
									<Icon name="user" size={24} />
								{/if}
								{#if model.id === vrmStore.activeModelId}
									<div class="active-check">
										<Icon name="check" size={12} strokeWidth={3} />
									</div>
								{/if}
							</div>
							<span class="model-name">{model.name}</span>
						</button>
					{/each}
				</div>
			</div>

				<!-- Core Personality (collapsible) -->
			<div class="personality-section">
				<button class="personality-toggle" onclick={() => personalityExpanded = !personalityExpanded}>
					<Icon name="sparkles" size={16} />
					<span>Core Personality</span>
					<Icon name={personalityExpanded ? 'chevron-up' : 'chevron-down'} size={16} />
				</button>
				{#if personalityExpanded}
					<div class="personality-content" transition:slideOpen>
						<textarea
							class="personality-textarea"
							bind:value={formSystemPrompt}
							placeholder="Personality traits, speaking style, background..."
							rows="8"
							onblur={saveSystemPrompt}
						></textarea>
					</div>
				{/if}
			</div>

			<!-- AI Services (collapsible) -->
			<div class="services-section">
				<button class="services-toggle" onclick={() => aiServicesExpanded = !aiServicesExpanded}>
					<Icon name="settings" size={16} />
					<span>AI Services</span>
					<Icon name={aiServicesExpanded ? 'chevron-up' : 'chevron-down'} size={16} />
				</button>

				{#if aiServicesExpanded}
					<div class="services-content" transition:slideOpen>
						<!-- LLM Config -->
						<div class="service-group">
							<div class="service-header">
								<Icon name="brain" size={14} />
								<span>Chat (LLM)</span>
								<button class="service-toggle" class:enabled={isLLMEnabled} onclick={toggleLLM} aria-label="Toggle chat (LLM)">
									<span class="toggle-track">
										<span class="toggle-thumb"></span>
									</span>
								</button>
							</div>

							{#if isLLMEnabled}
								<ProviderDropdown
									type="llm"
									value={consciousnessSettings.activeProvider as string}
									onSelect={handleLLMProviderChange}
									placeholder="Select LLM provider..."
								/>

								{#if consciousnessSettings.activeProvider}
									{@const provider = getLLMProvider(consciousnessSettings.activeProvider as string)}
									{#if provider?.requiresApiKey}
										<div class="api-key-row">
											<input
												type="password"
												class="api-key-input"
												class:error={llmFetchError}
												placeholder="API Key"
												value={settingsStore.getProviderConfig(provider.id).apiKey ?? ''}
												oninput={(e) => handleApiKeyChange(provider.id, e.currentTarget.value, 'llm')}
												onblur={handleLLMApiKeyBlur}
											/>
										</div>
									{/if}
								{/if}

								{#if consciousnessSettings.activeProvider}
									{@const provider = getLLMProvider(consciousnessSettings.activeProvider as string)}
									<ModelDropdown
										models={llmModels}
										value={consciousnessSettings.activeModel as string}
										onSelect={handleLLMModelChange}
										placeholder="Select model..."
										isLoading={llmIsLoading}
										onRefresh={llmHasApiKey ? fetchLLMModels : undefined}
										disabled={!llmHasApiKey}
										disabledMessage="Enter API key first"
									/>
								{/if}

								{#if consciousnessSettings.activeProvider}
									{@const provider = getLLMProvider(consciousnessSettings.activeProvider as string)}
									{#if provider?.isLocal}
										{#if llmFetchError}
											<p class="provider-note error">
												<Icon name="alert-circle" size={14} />
												{llmFetchError}
											</p>
										{/if}
										<div class="api-key-row">
											<input
												type="text"
												class="api-key-input"
												placeholder={provider.defaultBaseUrl || 'http://localhost:11434/v1/'}
												value={settingsStore.getProviderConfig(provider.id).baseUrl ?? ''}
												oninput={(e) => handleLLMBaseUrlChange(provider.id, e.currentTarget.value)}
												onblur={fetchLLMModels}
											/>
										</div>
									{/if}
								{/if}
							{/if}
						</div>

						<!-- TTS Config -->
						<div class="service-group">
							<div class="service-header">
								<Icon name="mic" size={14} />
								<span>Speech (TTS)</span>
								<button class="service-toggle" class:enabled={isTTSEnabled} onclick={toggleTTS} aria-label="Toggle speech (TTS)">
									<span class="toggle-track">
										<span class="toggle-thumb"></span>
									</span>
								</button>
							</div>

							{#if isTTSEnabled}
								<ProviderDropdown
									type="tts"
									value={speechSettings.activeProvider as string}
									onSelect={handleTTSProviderChange}
									placeholder="Select TTS provider..."
								/>

								{#if speechSettings.activeProvider}
									{@const provider = getTTSProvider(speechSettings.activeProvider as string)}
									{#if provider?.requiresApiKey}
										<div class="api-key-row">
											<input
												type="password"
												class="api-key-input"
												class:error={ttsFetchError}
												placeholder="API Key"
												value={settingsStore.getProviderConfig(provider.id).apiKey ?? ''}
												oninput={(e) => handleApiKeyChange(provider.id, e.currentTarget.value, 'tts')}
												onblur={handleTTSApiKeyBlur}
											/>
										</div>
									{/if}
								{/if}

								{#if speechSettings.activeProvider}
									{@const provider = getTTSProvider(speechSettings.activeProvider as string)}
									{#if !provider?.isLocal}
										<ModelDropdown
											models={ttsModels}
											value={speechSettings.activeModel as string}
											onSelect={handleTTSModelChange}
											placeholder="Select model..."
											isLoading={ttsIsLoading}
											onRefresh={ttsHasApiKey ? fetchTTSModels : undefined}
											disabled={!ttsHasApiKey}
											disabledMessage="Enter API key first"
										/>
									{/if}
								{/if}

								{#if speechSettings.activeProvider === 'elevenlabs'}
									<div class="api-key-row">
										<input
											type="text"
											class="api-key-input"
											placeholder="Custom Voice ID (optional)"
											value={settingsStore.elevenLabsVoiceId}
											onchange={(e) => settingsStore.setElevenLabsVoiceId(e.currentTarget.value)}
										/>
									</div>
								{/if}

								{#if speechSettings.activeProvider}
									{@const provider = getTTSProvider(speechSettings.activeProvider as string)}
									{#if provider?.isLocal}
										<div class="api-key-row">
											<input
												type="text"
												class="api-key-input"
												list="local-tts-voices"
												placeholder="Voice (e.g. af_bella)"
												value={speechSettings.activeVoiceId as string ?? ''}
												onchange={(e) => handleTTSVoiceChange(e.currentTarget.value)}
											/>
											<datalist id="local-tts-voices">
												{#each provider.voices ?? [] as voice}
													<option value={voice.id}>{voice.name}</option>
												{/each}
											</datalist>
										</div>
										<div class="api-key-row">
											<input
												type="text"
												class="api-key-input"
												placeholder="Model (optional, e.g. kokoro)"
												value={speechSettings.activeModel as string ?? ''}
												onchange={(e) => handleTTSModelChange(e.currentTarget.value)}
											/>
										</div>
										<div class="api-key-row">
											<input
												type="text"
												class="api-key-input"
												placeholder={provider.defaultBaseUrl || 'http://localhost:8880/v1/'}
												value={settingsStore.getProviderConfig(provider.id).baseUrl ?? ''}
												onchange={(e) => settingsStore.setProviderConfig(provider.id, { baseUrl: e.currentTarget.value })}
											/>
										</div>
									{/if}
								{/if}
							{/if}
						</div>

						<!-- STT Config -->
						<div class="service-group">
							<div class="service-header">
								<Icon name="mic" size={14} />
								<span>Voice Input (STT)</span>
							</div>
							<p class="stt-hint">Higher quality voice input via Groq's Whisper API. Required on desktop, optional in browser (falls back to Web Speech API).</p>
							<div class="api-key-row">
								<input
									type="password"
									class="api-key-input"
									placeholder="Groq API Key"
									value={settingsStore.getProviderConfig('groq-stt').apiKey ?? ''}
									oninput={(e) => {
										settingsStore.setProviderConfig('groq-stt', { apiKey: e.currentTarget.value });
										settingsStore.markProviderAdded('groq-stt');
									}}
								/>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right Panel: Stats -->
		<div class="stats-panel">
			{#if isCharacterLoading}
				<div class="loading-stats">Loading character data...</div>
			{/if}

			{#if isDatingSimMode}
				<!-- Bond Progress (Dating Sim Mode only) - Sims-style glossy bar -->
				<div class="bond-section">
					<div class="bond-progress">
						<div class="bond-header">
							<Tooltip content="Overall affection level. Grows through positive interactions, compliments, and time spent together." side="left">
								<div class="bond-icon">
									<Icon name="heart" size={18} />
								</div>
							</Tooltip>
							<div class="bond-info">
								<span class="bond-tier">{stageInfo.name}</span>
								<span class="bond-description">{stageInfo.description}</span>
							</div>
							<span class="bond-percent">{affectionPercent}%</span>
						</div>
						<div class="bond-bar-track">
							<div class="bond-bar-fill" style="width: {affectionPercent}%">
							</div>
							<div class="bond-bar-markers">
								{#each [25, 50, 75] as marker}
									<div class="bond-marker" style="left: {marker}%"></div>
								{/each}
							</div>
						</div>
					</div>
				</div>

				<!-- Relationship Stats (Dating Sim Mode only) - Sims-style vertical bars -->
				<div class="stats-section">
					<Tooltip content="Core relationship attributes that evolve based on your interactions.">
						<span class="section-label">Relationship Stats</span>
					</Tooltip>
					<div class="sims-stat-bars">
						<Tooltip content="How much she relies on and believes in you. Built through honesty and keeping promises.">
							<div class="sims-stat" style="--bar-color: var(--stat-trust); --bar-glow: rgba(77, 208, 255, 0.5)">
								<div class="sims-bar-track">
									<div class="sims-bar-fill" style="height: {charState.trust}%">
									</div>
								</div>
								<div class="sims-stat-icon">
									<Icon name="shield" size={14} />
								</div>
								<span class="sims-stat-label">Trust</span>
							</div>
						</Tooltip>
						<Tooltip content="Emotional closeness and vulnerability. Grows from meaningful conversations and shared experiences.">
							<div class="sims-stat" style="--bar-color: var(--stat-intimacy); --bar-glow: rgba(192, 132, 252, 0.5)">
								<div class="sims-bar-track">
									<div class="sims-bar-fill" style="height: {charState.intimacy}%">
									</div>
								</div>
								<div class="sims-stat-icon">
									<Icon name="heart" size={14} />
								</div>
								<span class="sims-stat-label">Intimacy</span>
							</div>
						</Tooltip>
						<Tooltip content="How at ease she feels around you. Increases with consistent, supportive presence.">
							<div class="sims-stat" style="--bar-color: var(--stat-comfort); --bar-glow: rgba(74, 222, 128, 0.5)">
								<div class="sims-bar-track">
									<div class="sims-bar-fill" style="height: {charState.comfort}%">
									</div>
								</div>
								<div class="sims-stat-icon">
									<Icon name="home" size={14} />
								</div>
								<span class="sims-stat-label">Comfort</span>
							</div>
						</Tooltip>
						<Tooltip content="How much she admires and values you. Earned through thoughtful actions and integrity.">
							<div class="sims-stat" style="--bar-color: var(--stat-respect); --bar-glow: rgba(96, 165, 250, 0.5)">
								<div class="sims-bar-track">
									<div class="sims-bar-fill" style="height: {charState.respect}%">
									</div>
								</div>
								<div class="sims-stat-icon">
									<Icon name="award" size={14} />
								</div>
								<span class="sims-stat-label">Respect</span>
							</div>
						</Tooltip>
						<Tooltip content="Her current energy level. Affects mood and responsiveness. Replenishes over time.">
							<div class="sims-stat" style="--bar-color: var(--stat-energy); --bar-glow: rgba(251, 191, 36, 0.5)">
								<div class="sims-bar-track">
									<div class="sims-bar-fill" style="height: {charState.energy}%">
									</div>
								</div>
								<div class="sims-stat-icon">
									<Icon name="zap" size={14} />
								</div>
								<span class="sims-stat-label">Energy</span>
							</div>
						</Tooltip>
					</div>
				</div>
			{:else}
				<!-- Companion Mode: Simplified stats -->
				<div class="companion-mode-section">
					<div class="companion-badge">
						<Icon name="sparkles" size={20} />
						<span>Companion Mode</span>
					</div>
					<p class="companion-description">Relationship stats and events are disabled. Only mood and energy are tracked.</p>
				</div>

				<!-- Energy bar (Companion Mode) - Sims-style -->
				<div class="stats-section companion-energy">
					<span class="section-label">Energy</span>
					<div class="sims-stat-bars single">
						<div class="sims-stat" style="--bar-color: var(--stat-energy); --bar-glow: rgba(251, 191, 36, 0.5)">
							<div class="sims-bar-track tall">
								<div class="sims-bar-fill" style="height: {charState.energy}%">
								</div>
							</div>
							<div class="sims-stat-icon">
								<Icon name="zap" size={16} />
							</div>
							<span class="sims-stat-label">Energy</span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Mood - Sims-style glossy card -->
			<div class="mood-section">
				<Tooltip content="Her emotional state right now, influenced by recent interactions and events.">
					<span class="section-label">Current Mood</span>
				</Tooltip>
				<div class="mood-card" style="--mood-color: {moodInfo.color}">
					<div class="mood-icon-badge">
						<Icon name={moodInfo.icon} size={24} />
					</div>
					<div class="mood-info">
						<span class="mood-name">{moodInfo.description}</span>
						{#if charState.mood.causes.length > 0}
							<span class="mood-cause">{charState.mood.causes[charState.mood.causes.length - 1]}</span>
						{/if}
					</div>
					<div class="mood-indicator">
						<div class="mood-pulse"></div>
					</div>
				</div>
			</div>

			<!-- Activity - Sims-style stat tiles -->
			<div class="activity-section">
				<span class="section-label">Activity</span>
				<div class="activity-grid">
					<div class="activity-tile" style="--tile-color: #ff8f3f; --tile-glow: rgba(255, 143, 63, 0.4)">
						<div class="activity-tile-icon">
							<Icon name="flame" size={16} />
						</div>
						<span class="activity-tile-value">{charState.currentStreak}</span>
						<span class="activity-tile-label">Streak</span>
					</div>
					<div class="activity-tile" style="--tile-color: #fbbf24; --tile-glow: rgba(251, 191, 36, 0.4)">
						<div class="activity-tile-icon">
							<Icon name="trophy" size={16} />
						</div>
						<span class="activity-tile-value">{charState.longestStreak}</span>
						<span class="activity-tile-label">Best</span>
					</div>
					<div class="activity-tile" style="--tile-color: #4dd0ff; --tile-glow: rgba(77, 208, 255, 0.4)">
						<div class="activity-tile-icon">
							<Icon name="message-circle" size={16} />
						</div>
						<span class="activity-tile-value">{charState.totalInteractions}</span>
						<span class="activity-tile-label">Chats</span>
					</div>
					<div class="activity-tile" style="--tile-color: #4ade80; --tile-glow: rgba(74, 222, 128, 0.4)">
						<div class="activity-tile-icon">
							<Icon name="calendar" size={16} />
						</div>
						<span class="activity-tile-value">{charState.daysKnown}</span>
						<span class="activity-tile-label">Days</span>
					</div>
				</div>
			</div>

			<!-- Events (Dating Sim Mode only, collapsible) - Sims-style achievements -->
			{#if isDatingSimMode}
				<div class="events-section">
					<button class="events-toggle" onclick={() => eventsExpanded = !eventsExpanded}>
						<div class="events-toggle-icon">
							<Icon name="star" size={16} />
						</div>
						<span>Achievements</span>
						{#if achievements.length > 0}
							<span class="events-count">{achievements.length}</span>
						{/if}
						<Icon name={eventsExpanded ? 'chevron-up' : 'chevron-down'} size={16} />
					</button>

					{#if eventsExpanded}
						<div class="events-content" transition:slideOpen>
							{#if achievements.length > 0}
								<div class="events-list">
									{#each achievements as achievement, i}
										{@const config = achievementConfig[achievement.type]}
										<div
											class="achievement-card"
											style="--event-color: {config.color}; --event-bg: {config.bgColor}; --delay: {i}"
										>
											<div class="achievement-badge">
												<Icon name={config.icon} size={18} />
											</div>
											<div class="achievement-info">
												<span class="achievement-name">{achievement.name}</span>
												<div class="achievement-meta">
													<span class="achievement-type">{config.label}</span>
													<span class="achievement-date">{formatAchievementDate(achievement.completedAt)}</span>
												</div>
											</div>
											<div class="achievement-check">
												<Icon name="check" size={14} strokeWidth={3} />
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="events-empty">
									<div class="empty-icon">
										<Icon name="sparkles" size={28} />
									</div>
									<span class="empty-title">No achievements yet</span>
									<span class="empty-hint">Keep chatting to unlock special moments!</span>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Upload Modal -->
	{#if uploadModalOpen}
		<div
			class="upload-modal"
			transition:fadeFast={{ duration: 180 }}
			role="button"
			tabindex="0"
			onclick={() => uploadModalOpen = false}
			onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); uploadModalOpen = false; } }}
		>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="upload-content" transition:pop={{ duration: 220, y: 14 }} onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
				<div class="upload-header">
					<h3>Upload Custom Model</h3>
					<button class="close-btn" onclick={() => uploadModalOpen = false}>
						<Icon name="x" size={20} />
					</button>
				</div>
				<VrmUploader onUpload={handleUpload} />
			</div>
		</div>
	{/if}

	<!-- Mode Change Confirmation Modal -->
	{#if modeConfirmOpen}
		<div
			class="confirm-modal"
			transition:fadeFast={{ duration: 180 }}
			role="button"
			tabindex="0"
			onclick={cancelModeChange}
			onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cancelModeChange(); } }}
		>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="confirm-content" transition:pop={{ duration: 220, y: 14 }} onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
				<div class="confirm-icon">
					<Icon name="alert" size={32} />
				</div>
				<h3 class="confirm-title">Switch Mode?</h3>
				<p class="confirm-message">
					Switching modes frequently can lead to unexpected results and disrupt natural progression. Are you sure you want to continue?
				</p>
				<div class="confirm-actions">
					<button class="confirm-btn confirm-btn--cancel" onclick={cancelModeChange}>
						Cancel
					</button>
					<button class="confirm-btn confirm-btn--confirm" onclick={confirmModeChange}>
						Switch Mode
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.character-screen {
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* Header */
	.screen-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-light);
		margin-bottom: 1rem;
		flex-shrink: 0;
	}

	.name-input {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		padding: 0.25rem 0;
		width: auto;
		min-width: 120px;
		max-width: 280px;
		transition: border-color 0.15s ease;
	}

	.name-input:hover {
		border-bottom-color: var(--border-light);
	}

	.name-input:focus {
		outline: none;
		border-bottom-color: var(--accent);
	}

	/* Main Content */
	.main-content {
		flex: 1;
		display: flex;
		gap: 1.5rem;
		min-height: 0;
		overflow: hidden;
	}

	/* Character Panel (Left) */
	.character-panel {
		flex: 1 1 55%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 0;
		min-height: 0;
		overflow-y: auto;
	}

	.character-panel > * {
		flex-shrink: 0;
	}

	/* Mode Section */
	.mode-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-light);
	}

	.mode-toggle {
		display: flex;
		gap: 0.5rem;
	}

	.mode-option {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.625rem 0.75rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
	}

	.mode-option:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.mode-option.active {
		background: var(--accent-muted);
		color: var(--accent);
	}

	/* Companion Mode Section */
	.companion-mode-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1.25rem;
		background: var(--accent-subtle);
		border-radius: var(--radius-lg);
	}

	.companion-badge {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--accent);
		border-radius: var(--radius-full);
		color: #fff;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.companion-description {
		margin: 0;
		text-align: center;
		font-size: 0.75rem;
		color: var(--text-tertiary);
		line-height: 1.5;
	}

	/* Model Gallery */
	.model-gallery {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.gallery-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.gallery-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-tertiary);
	}

	.upload-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: var(--bg-tertiary);
		border-radius: var(--radius-full);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.upload-btn:hover {
		background: color-mix(in srgb, var(--bg-tertiary), var(--text-primary) 8%);
		color: var(--text-primary);
	}

	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 0.75rem;
	}

	.model-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: background 0.15s ease, box-shadow 0.15s ease;
		box-shadow: var(--shadow-xs);
	}

	.model-card:hover {
		box-shadow: var(--shadow-sm);
	}

	.model-card.active {
		background: var(--accent-muted);
	}

	.model-card.active .model-name {
		color: var(--accent);
	}

	.model-card.active .model-preview {
		background: var(--bg-primary);
		color: var(--accent);
	}

	.model-preview {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-tertiary);
	}

	.model-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.active-check {
		position: absolute;
		top: 0.375rem;
		right: 0.375rem;
		width: 22px;
		height: 22px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--accent);
		color: #fff;
		border-radius: var(--radius-full);
		box-shadow: var(--shadow-sm);
	}

	.model-name {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	/* Personality Section */
	.personality-section {
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: var(--shadow-sm);
	}

	.personality-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.875rem 1rem;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.personality-toggle:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.personality-toggle span {
		flex: 1;
		text-align: left;
	}

	.personality-content {
		padding: 0 1rem 1rem;
	}

	.personality-textarea {
		width: 100%;
		padding: 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid transparent;
		border-radius: var(--radius-lg);
		font-family: var(--font-mono);
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--text-primary);
		resize: vertical;
		transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
	}

	.personality-textarea::placeholder {
		color: var(--text-tertiary);
	}

	.personality-textarea:focus {
		outline: none;
		background: var(--bg-primary);
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-muted);
	}

	/* Stats Panel (Right) */
	.stats-panel {
		flex: 1 1 45%;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		min-width: 0;
		min-height: 0;
		overflow-y: auto;
	}

	.stats-panel > * {
		flex-shrink: 0;
	}

	.loading-stats {
		padding: 1.25rem;
		text-align: center;
		color: var(--text-tertiary);
		font-size: 0.875rem;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}

	.section-label {
		display: block;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-tertiary);
		margin-bottom: 0.75rem;
	}

	/* Bond Section */
	.bond-section {
		padding: 1.25rem;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}

	.bond-progress {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.bond-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.bond-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: var(--stat-intimacy);
		border-radius: var(--radius-md);
		color: #fff;
	}

	.bond-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.bond-tier {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.bond-description {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	.bond-percent {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--stat-intimacy);
	}

	.bond-bar-track {
		position: relative;
		height: 8px;
		background: var(--bg-tertiary);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.bond-bar-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		background: var(--stat-intimacy);
		border-radius: var(--radius-full);
		transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.bond-bar-markers {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
	}

	.bond-marker {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 1px;
		background: var(--border-light);
	}

	/* Stats Section */
	.stats-section {
		padding: 1rem 1.25rem;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}

	/* Vertical Stat Bars */
	.sims-stat-bars {
		display: flex;
		justify-content: center;
		gap: 0.75rem;
		padding: 0.5rem 0;
	}

	.sims-stat-bars.single {
		justify-content: center;
	}

	.sims-stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
	}

	.sims-bar-track {
		width: 20px;
		height: 80px;
		background: var(--bg-tertiary);
		border-radius: var(--radius-full);
		position: relative;
		overflow: hidden;
	}

	.sims-bar-track.tall {
		height: 100px;
		width: 24px;
	}

	.sims-bar-fill {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--bar-color);
		border-radius: var(--radius-full);
		transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.sims-stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		background: var(--bg-secondary);
		border-radius: var(--radius-sm);
		color: var(--bar-color);
	}

	.sims-stat-label {
		font-size: 0.6rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--text-tertiary);
	}

	.companion-energy {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.companion-energy .sims-stat-bars {
		width: 100%;
	}

	/* Mood Section */
	.mood-section {
		padding: 1rem 1.25rem;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}

	.mood-card {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.75rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
	}

	.mood-icon-badge {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		background: var(--mood-color);
		border-radius: var(--radius-md);
		color: #fff;
		flex-shrink: 0;
	}

	.mood-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.mood-name {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.mood-cause {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		font-style: italic;
	}

	.mood-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mood-pulse {
		width: 10px;
		height: 10px;
		background: var(--mood-color);
		border-radius: var(--radius-full);
		animation: mood-pulse 2s ease-in-out infinite;
	}

	@keyframes mood-pulse {
		0%, 100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.2);
			opacity: 0.7;
		}
	}

	/* Activity Section */
	.activity-section {
		padding: 1rem 1.25rem;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
	}

	.activity-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.625rem;
	}

	.activity-tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		padding: 0.875rem 0.5rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s ease;
	}

	.activity-tile:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-sm);
	}

	.activity-tile-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: var(--tile-color);
		border-radius: var(--radius-sm);
		color: #fff;
	}

	.activity-tile-value {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.2;
	}

	.activity-tile-label {
		font-size: 0.6rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--text-tertiary);
	}

	/* Events / Achievements Section */
	.events-section {
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: var(--shadow-sm);
	}

	.events-toggle {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		width: 100%;
		padding: 1rem 1.25rem;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.events-toggle:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.events-toggle-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: var(--color-warning);
		border-radius: var(--radius-sm);
		color: #fff;
	}

	.events-toggle span {
		flex: 1;
		text-align: left;
	}

	.events-count {
		font-size: 0.7rem;
		font-weight: 700;
		color: #fff;
		background: var(--accent);
		padding: 0.25rem 0.625rem;
		border-radius: var(--radius-full);
	}

	.events-content {
		padding: 0 1rem 1.25rem;
	}

	.events-list {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.achievement-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s ease;
		animation: achievement-slide 0.3s ease-out backwards;
		animation-delay: calc(var(--delay) * 50ms);
	}

	@keyframes achievement-slide {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.achievement-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-sm);
	}

	.achievement-badge {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: var(--event-color);
		border-radius: var(--radius-md);
		color: #fff;
		flex-shrink: 0;
	}

	.achievement-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.achievement-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.achievement-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.7rem;
	}

	.achievement-type {
		color: var(--event-color);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.achievement-date {
		color: var(--text-tertiary);
	}

	.achievement-date::before {
		content: '•';
		margin-right: 0.5rem;
		opacity: 0.5;
	}

	.achievement-check {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		background: var(--color-success);
		border-radius: var(--radius-full);
		color: #fff;
		flex-shrink: 0;
	}

	.events-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.625rem;
		padding: 2rem 1rem;
		text-align: center;
	}

	.empty-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		background: var(--bg-secondary);
		border-radius: var(--radius-lg);
		color: var(--text-tertiary);
	}

	.empty-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.empty-hint {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	/* AI Services Section */
	.services-section {
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: var(--shadow-sm);
	}

	.services-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.875rem 1rem;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.services-toggle:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.services-toggle span {
		flex: 1;
		text-align: left;
	}

	.services-content {
		padding: 0 1rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.service-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.stt-hint {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		margin: 0;
		line-height: 1.4;
	}

	.service-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-tertiary);
		margin-bottom: 0.25rem;
	}

	.service-toggle {
		margin-left: auto;
		position: relative;
		width: 40px;
		height: 22px;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.toggle-track {
		display: block;
		width: 100%;
		height: 100%;
		background: var(--bg-tertiary);
		border-radius: var(--radius-full);
		transition: background 0.2s ease;
	}

	.service-toggle.enabled .toggle-track {
		background: var(--accent);
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 18px;
		height: 18px;
		background: #fff;
		border-radius: var(--radius-full);
		transition: transform 0.2s ease;
		box-shadow: var(--shadow-xs);
	}

	.service-toggle.enabled .toggle-thumb {
		transform: translateX(18px);
	}

	.api-key-row {
		display: flex;
		gap: 0.5rem;
	}

	.provider-note {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin: 0;
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	.provider-note.error {
		color: var(--color-error);
	}

	.api-key-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid transparent;
		border-radius: var(--radius-lg);
		font-size: 0.8rem;
		font-family: var(--font-mono);
		color: var(--text-primary);
		transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
	}

	.api-key-input::placeholder {
		color: var(--text-tertiary);
	}

	.api-key-input:focus {
		outline: none;
		background: var(--bg-primary);
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-muted);
	}

	.api-key-input.error {
		border-color: var(--color-error);
		animation: shake 0.4s ease-out;
	}

	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		20% { transform: translateX(-4px); }
		40% { transform: translateX(4px); }
		60% { transform: translateX(-3px); }
		80% { transform: translateX(2px); }
	}

	/* Upload Modal */
	.upload-modal {
		position: fixed;
		inset: 0;
		background: rgba(28, 43, 51, 0.28);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 2rem;
	}

	.upload-content {
		background: var(--bg-primary);
		border-radius: var(--radius-xl);
		max-width: 400px;
		width: 100%;
		overflow: hidden;
		box-shadow: var(--shadow-xl);
	}

	.upload-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--border-light);
	}

	.upload-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: background 0.15s ease, color 0.15s ease;
	}

	.close-btn:hover {
		background: color-mix(in srgb, var(--bg-tertiary), var(--text-primary) 8%);
		color: var(--text-primary);
	}

	.upload-content :global(.uploader) {
		margin: 1rem;
		aspect-ratio: auto;
		min-height: 200px;
	}

	/* Confirmation Modal */
	.confirm-modal {
		position: fixed;
		inset: 0;
		background: rgba(28, 43, 51, 0.28);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 2rem;
	}

	.confirm-content {
		background: var(--bg-primary);
		border-radius: var(--radius-xl);
		max-width: 360px;
		width: 100%;
		padding: 1.5rem;
		text-align: center;
		box-shadow: var(--shadow-xl);
	}

	.confirm-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		background: var(--accent-subtle);
		border-radius: var(--radius-full);
		color: var(--accent);
		margin-bottom: 1rem;
	}

	.confirm-title {
		margin: 0 0 0.75rem;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.confirm-message {
		margin: 0 0 1.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.confirm-actions {
		display: flex;
		gap: 0.75rem;
	}

	.confirm-btn {
		flex: 1;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: 1px solid transparent;
		transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.confirm-btn--cancel {
		background: var(--bg-tertiary);
		color: var(--text-secondary);
	}

	.confirm-btn--cancel:hover {
		background: color-mix(in srgb, var(--bg-tertiary), var(--text-primary) 8%);
		color: var(--text-primary);
	}

	.confirm-btn--confirm {
		background: var(--accent);
		color: #fff;
	}

	.confirm-btn--confirm:hover {
		background: var(--accent-hover);
		box-shadow: var(--shadow-glow);
	}

	/* Mobile */
	@media (max-width: 900px) {
		.name-input {
			font-size: 1.25rem;
		}

		.main-content {
			flex-direction: column;
			overflow-y: auto;
		}

		.character-panel {
			flex: none;
		}

		.gallery-grid {
			grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
		}

		.stats-panel {
			flex: none;
			overflow: visible;
		}

		.activity-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 480px) {
		.gallery-grid {
			grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
			gap: 0.5rem;
		}

		.model-card {
			padding: 0.5rem;
		}

		.model-name {
			font-size: 0.7rem;
		}
	}
</style>
