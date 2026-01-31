<script lang="ts">
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
	import { fetchProviderModels, type ModelInfo } from '$lib/services/providers/model-fetcher';

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

	// Fetch models from provider API
	async function fetchLLMModels() {
		const targetProvider = consciousnessSettings.activeProvider as string;
		if (!targetProvider) return;
		const provider = getLLMProvider(targetProvider);
		if (!provider || provider.isLocal) return;

		const config = settingsStore.getProviderConfig(provider.id);
		if (!config.apiKey) return;

		llmIsLoading = true;
		llmFetchError = null;

		const result = await fetchProviderModels(
			provider.id,
			config.apiKey,
			config.baseUrl
		);

		// Provider changed during fetch - discard stale results
		if (consciousnessSettings.activeProvider !== targetProvider) {
			llmIsLoading = false;
			return;
		}

		llmIsLoading = false;

		if (result.error) {
			llmFetchError = 'Using default list';
			llmDynamicModels = null;
		} else if (result.models.length > 0) {
			llmDynamicModels = result.models;
			settingsStore.setCachedModels(provider.id, result.models);
			// Auto-select first model if none selected or current selection not in list
			const currentModel = consciousnessSettings.activeModel as string;
			const modelExists = result.models.some(m => m.id === currentModel);
			if (!currentModel || !modelExists) {
				modulesStore.setModuleSetting('consciousness', 'activeModel', result.models[0].id);
			}
		} else {
			// Empty but not an error - silently fall back to static models
			llmDynamicModels = null;
		}
	}

	// Fetch TTS models from provider API
	async function fetchTTSModels() {
		const targetProvider = speechSettings.activeProvider as string;
		if (!targetProvider) return;
		const provider = getTTSProvider(targetProvider);
		if (!provider || provider.isLocal) return;

		const config = settingsStore.getProviderConfig(provider.id);
		if (!config.apiKey) return;

		ttsIsLoading = true;
		ttsFetchError = null;

		const result = await fetchProviderModels(
			provider.id,
			config.apiKey,
			config.baseUrl
		);

		// Provider changed during fetch - discard stale results
		if (speechSettings.activeProvider !== targetProvider) {
			ttsIsLoading = false;
			return;
		}

		ttsIsLoading = false;

		if (result.error) {
			ttsFetchError = 'Using default list';
			ttsDynamicModels = null;
		} else if (result.models.length > 0) {
			ttsDynamicModels = result.models;
			settingsStore.setCachedModels(provider.id, result.models);
			// Auto-select first model if none selected or current selection not in list
			const currentModel = speechSettings.activeModel as string;
			const modelExists = result.models.some(m => m.id === currentModel);
			if (!currentModel || !modelExists) {
				modulesStore.setModuleSetting('speech', 'activeModel', result.models[0].id);
			}
		} else {
			// Empty but not an error - silently fall back to static models
			ttsDynamicModels = null;
		}
	}

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
		const cached = settingsStore.getCachedModels(providerId);
		if (cached && cached.length > 0) {
			llmDynamicModels = cached;
		}

		if (provider?.models?.length) {
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

	function handleTTSProviderChange(providerId: string) {
		modulesStore.setModuleSetting('speech', 'activeProvider', providerId);
		const provider = getTTSProvider(providerId);

		// Reset dynamic models when provider changes
		ttsDynamicModels = null;
		ttsFetchError = null;
		ttsIsLoading = false;

		// Check for cached models
		const cached = settingsStore.getCachedModels(providerId);
		if (cached && cached.length > 0) {
			ttsDynamicModels = cached;
		}

		if (provider?.models?.length) {
			modulesStore.setModuleSetting('speech', 'activeModel', provider.models[0].id);
		}
		// Mark local providers as added immediately (they don't need API keys)
		if (provider?.isLocal || !provider?.requiresApiKey) {
			settingsStore.markProviderAdded(providerId);
		}
	}

	function handleTTSModelChange(modelId: string) {
		modulesStore.setModuleSetting('speech', 'activeModel', modelId);
	}

	function handleTTSApiKeyBlur() {
		const providerId = speechSettings.activeProvider as string;
		if (!providerId) return;
		const provider = getTTSProvider(providerId);
		const config = settingsStore.getProviderConfig(providerId);
		if (config.apiKey && provider && !provider.isLocal) {
			fetchTTSModels();
		}
	}

	function handleApiKeyChange(providerId: string, apiKey: string) {
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
			fetchLLMModels();
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
					<div class="personality-content">
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
					<div class="services-content">
						<!-- LLM Config -->
						<div class="service-group">
							<div class="service-header">
								<Icon name="brain" size={14} />
								<span>Chat (LLM)</span>
								<button class="service-toggle" class:enabled={isLLMEnabled} onclick={toggleLLM}>
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
												placeholder="API Key"
												value={settingsStore.getProviderConfig(provider.id).apiKey ?? ''}
												onchange={(e) => handleApiKeyChange(provider.id, e.currentTarget.value)}
												onblur={handleLLMApiKeyBlur}
											/>
										</div>
									{/if}
								{/if}

								{#if consciousnessSettings.activeProvider}
									{@const provider = getLLMProvider(consciousnessSettings.activeProvider as string)}
									{#if !provider?.isLocal}
										<ModelDropdown
											models={llmModels}
											value={consciousnessSettings.activeModel as string}
											onSelect={handleLLMModelChange}
											placeholder="Select model..."
											isLoading={llmIsLoading}
											fetchError={llmFetchError}
											onRefresh={llmHasApiKey ? fetchLLMModels : undefined}
											disabled={!llmHasApiKey}
											disabledMessage="Enter API key first"
										/>
									{/if}
								{/if}

								{#if consciousnessSettings.activeProvider}
									{@const provider = getLLMProvider(consciousnessSettings.activeProvider as string)}
									{#if provider?.isLocal}
										<div class="api-key-row">
											<input
												type="text"
												class="api-key-input"
												placeholder="Model name (e.g., llama3.2:latest)"
												value={consciousnessSettings.activeModel as string ?? ''}
												onchange={(e) => handleLLMModelChange(e.currentTarget.value)}
											/>
										</div>
										<div class="api-key-row">
											<input
												type="text"
												class="api-key-input"
												placeholder={provider.defaultBaseUrl || 'http://localhost:11434/v1/'}
												value={settingsStore.getProviderConfig(provider.id).baseUrl ?? ''}
												onchange={(e) => settingsStore.setProviderConfig(provider.id, { baseUrl: e.currentTarget.value })}
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
								<button class="service-toggle" class:enabled={isTTSEnabled} onclick={toggleTTS}>
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
												placeholder="API Key"
												value={settingsStore.getProviderConfig(provider.id).apiKey ?? ''}
												onchange={(e) => handleApiKeyChange(provider.id, e.currentTarget.value)}
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
											fetchError={ttsFetchError}
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
												placeholder="Model/voice name"
												value={speechSettings.activeModel as string ?? ''}
												onchange={(e) => handleTTSModelChange(e.currentTarget.value)}
											/>
										</div>
									{/if}
									{#if provider?.isLocal}
										<div class="api-key-row">
											<input
												type="text"
												class="api-key-input"
												placeholder={provider.defaultBaseUrl || 'http://localhost:5000/'}
												value={settingsStore.getProviderConfig(provider.id).baseUrl ?? ''}
												onchange={(e) => settingsStore.setProviderConfig(provider.id, { baseUrl: e.currentTarget.value })}
											/>
										</div>
									{/if}
								{/if}
							{/if}
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
				<!-- Bond Progress (Dating Sim Mode only) -->
				<div class="bond-section">
					<div class="bond-progress">
						<div class="affection-label">
							<Tooltip content="Overall affection level. Grows through positive interactions, compliments, and time spent together." side="left">
								<span class="heart-glow"><Icon name="heart" size={14} color="var(--ctp-pink)" /></span>
							</Tooltip>
							<span class="tier-name">{stageInfo.name}</span>
							<span class="affection-value">{affectionPercent}%</span>
						</div>
						<Progress value={affectionPercent} variant="affection" size="md" />
						<span class="bond-stage">{stageInfo.description}</span>
					</div>
				</div>

				<!-- Relationship Stats (Dating Sim Mode only) -->
				<div class="stats-section">
					<Tooltip content="Core relationship attributes that evolve based on your interactions.">
						<span class="section-label">Relationship Stats</span>
					</Tooltip>
					<div class="stat-bars">
						<div class="stat-bar stat-bar--trust">
							<Tooltip content="How much she relies on and believes in you. Built through honesty and keeping promises." side="left">
								<div class="stat-info">
									<Icon name="shield" size={14} />
									<span class="stat-name">Trust</span>
								</div>
							</Tooltip>
							<div class="stat-track">
								<div class="stat-fill" style="width: {charState.trust}%"></div>
							</div>
							<span class="stat-value">{charState.trust}%</span>
						</div>
						<div class="stat-bar stat-bar--intimacy">
							<Tooltip content="Emotional closeness and vulnerability. Grows from meaningful conversations and shared experiences." side="left">
								<div class="stat-info">
									<Icon name="heart" size={14} />
									<span class="stat-name">Intimacy</span>
								</div>
							</Tooltip>
							<div class="stat-track">
								<div class="stat-fill" style="width: {charState.intimacy}%"></div>
							</div>
							<span class="stat-value">{charState.intimacy}%</span>
						</div>
						<div class="stat-bar stat-bar--comfort">
							<Tooltip content="How at ease she feels around you. Increases with consistent, supportive presence." side="left">
								<div class="stat-info">
									<Icon name="home" size={14} />
									<span class="stat-name">Comfort</span>
								</div>
							</Tooltip>
							<div class="stat-track">
								<div class="stat-fill" style="width: {charState.comfort}%"></div>
							</div>
							<span class="stat-value">{charState.comfort}%</span>
						</div>
						<div class="stat-bar stat-bar--respect">
							<Tooltip content="How much she admires and values you. Earned through thoughtful actions and integrity." side="left">
								<div class="stat-info">
									<Icon name="award" size={14} />
									<span class="stat-name">Respect</span>
								</div>
							</Tooltip>
							<div class="stat-track">
								<div class="stat-fill" style="width: {charState.respect}%"></div>
							</div>
							<span class="stat-value">{charState.respect}%</span>
						</div>
						<div class="stat-bar stat-bar--energy">
							<Tooltip content="Her current energy level. Affects mood and responsiveness. Replenishes over time." side="left">
								<div class="stat-info">
									<Icon name="zap" size={14} />
									<span class="stat-name">Energy</span>
								</div>
							</Tooltip>
							<div class="stat-track">
								<div class="stat-fill" style="width: {charState.energy}%"></div>
							</div>
							<span class="stat-value">{charState.energy}%</span>
						</div>
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

				<!-- Energy bar (Companion Mode) -->
				<div class="stats-section">
					<span class="section-label">Energy</span>
					<div class="stat-bars">
						<div class="stat-bar stat-bar--energy">
							<div class="stat-info">
								<Icon name="zap" size={14} />
								<span class="stat-name">Energy</span>
							</div>
							<div class="stat-track">
								<div class="stat-fill" style="width: {charState.energy}%"></div>
							</div>
							<span class="stat-value">{charState.energy}%</span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Mood -->
			<div class="mood-section">
				<Tooltip content="Her emotional state right now, influenced by recent interactions and events.">
					<span class="section-label">Current Mood</span>
				</Tooltip>
				<div class="mood-display" style="--mood-color: {moodInfo.color}">
					<div class="mood-icon-lg">
						<Icon name={moodInfo.icon} size={28} />
					</div>
					<div class="mood-text">
						<span class="mood-name">{moodInfo.description}</span>
						{#if charState.mood.causes.length > 0}
							<span class="mood-cause">{charState.mood.causes[charState.mood.causes.length - 1]}</span>
						{/if}
					</div>
				</div>
			</div>

			<!-- Activity -->
			<div class="activity-section">
				<span class="section-label">Activity</span>
				<div class="activity-grid">
					<div class="activity-item activity-item--streak">
						<Icon name="flame" size={18} />
						<span class="activity-value">{charState.currentStreak}</span>
						<span class="activity-label">Streak</span>
					</div>
					<div class="activity-item activity-item--best">
						<Icon name="trophy" size={18} />
						<span class="activity-value">{charState.longestStreak}</span>
						<span class="activity-label">Best</span>
					</div>
					<div class="activity-item activity-item--chats">
						<Icon name="message-circle" size={18} />
						<span class="activity-value">{charState.totalInteractions}</span>
						<span class="activity-label">Chats</span>
					</div>
					<div class="activity-item activity-item--days">
						<Icon name="calendar" size={18} />
						<span class="activity-value">{charState.daysKnown}</span>
						<span class="activity-label">Days</span>
					</div>
				</div>
			</div>

			<!-- Events (Dating Sim Mode only, collapsible) -->
			{#if isDatingSimMode}
				<div class="events-section">
					<button class="events-toggle" onclick={() => eventsExpanded = !eventsExpanded}>
						<Icon name="star" size={16} />
						<span>Events</span>
						{#if achievements.length > 0}
							<span class="events-count">{achievements.length}</span>
						{/if}
						<Icon name={eventsExpanded ? 'chevron-up' : 'chevron-down'} size={16} />
					</button>

					{#if eventsExpanded}
						<div class="events-content">
							{#if achievements.length > 0}
								<div class="events-list">
									{#each achievements as achievement}
										{@const config = achievementConfig[achievement.type]}
										<div
											class="event-card"
											style="--event-color: {config.color}; --event-bg: {config.bgColor}"
										>
											<div class="event-badge">
												<Icon name={config.icon} size={16} />
											</div>
											<div class="event-content">
												<span class="event-name">{achievement.name}</span>
												<div class="event-meta">
													<span class="event-type">{config.label}</span>
													<span class="event-date">{formatAchievementDate(achievement.completedAt)}</span>
												</div>
											</div>
											<div class="event-check">
												<Icon name="check" size={12} strokeWidth={3} />
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="events-empty">
									<Icon name="sparkles" size={24} />
									<span>No events yet</span>
									<span class="events-hint">Keep chatting to unlock special moments!</span>
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
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="upload-modal" onclick={() => uploadModalOpen = false}>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="upload-content" onclick={(e) => e.stopPropagation()}>
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
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="confirm-modal" onclick={cancelModeChange}>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="confirm-content" onclick={(e) => e.stopPropagation()}>
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
		border-bottom: 1px solid var(--color-neutral-200);
		margin-bottom: 1rem;
		flex-shrink: 0;
	}

	.name-input {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-neutral-900);
		background: transparent;
		border: none;
		padding: 0;
		width: auto;
		min-width: 120px;
		max-width: 280px;
	}

	.name-input:focus {
		outline: none;
		border-bottom: 2px solid var(--ctp-pink);
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
		border-bottom: 1px solid var(--color-neutral-200);
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
		background: var(--color-neutral-100);
		border: 2px solid var(--color-neutral-200);
		border-radius: 0.5rem;
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--color-neutral-600);
		cursor: pointer;
		transition: all 0.15s;
	}

	.mode-option:hover {
		border-color: var(--color-neutral-300);
	}

	.mode-option.active {
		background: color-mix(in srgb, var(--accent) 10%, transparent);
		border-color: var(--accent);
		color: var(--accent);
	}

	/* Companion Mode Section */
	.companion-mode-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 1.25rem;
		background: color-mix(in srgb, var(--accent) 5%, var(--color-neutral-100));
		border: 1px solid var(--color-neutral-200);
		border-radius: 0.75rem;
	}

	.companion-badge {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		border-radius: 2rem;
		color: var(--accent);
		font-weight: 600;
		font-size: 0.875rem;
	}

	.companion-description {
		margin: 0;
		text-align: center;
		font-size: 0.75rem;
		color: var(--color-neutral-500);
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
		color: var(--color-neutral-500);
	}

	.upload-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.625rem;
		background: var(--color-neutral-100);
		border: 1px solid var(--color-neutral-200);
		border-radius: 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--color-neutral-700);
		cursor: pointer;
		transition: all 0.15s;
	}

	.upload-btn:hover {
		background: var(--color-neutral-200);
		border-color: var(--color-neutral-300);
	}

	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		gap: 0.75rem;
	}

	.model-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem;
		background: var(--color-neutral-100);
		border: 2px solid var(--color-neutral-200);
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.model-card:hover {
		border-color: var(--color-neutral-300);
	}

	.model-card.active {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 8%, transparent);
	}

	.model-preview {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		background: var(--color-neutral-200);
		border-radius: 0.5rem;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-neutral-400);
	}

	.model-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.active-check {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--accent);
		color: var(--accent-foreground);
		border-radius: 50%;
	}

	.model-name {
		font-size: 0.65rem;
		font-weight: 500;
		color: var(--color-neutral-700);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	/* Personality Section */
	.personality-section {
		background: var(--color-neutral-100);
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.personality-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.875rem 1rem;
		background: transparent;
		border: none;
		color: var(--color-neutral-700);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}

	.personality-toggle:hover {
		background: var(--color-neutral-200);
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
		background: var(--color-neutral-50);
		border: 1px solid var(--color-neutral-200);
		border-radius: 0.5rem;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--color-neutral-800);
		resize: vertical;
	}

	.personality-textarea:focus {
		outline: none;
		border-color: var(--ctp-pink);
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
		padding: 1rem;
		text-align: center;
		color: var(--color-neutral-500);
		font-size: 0.875rem;
	}

	.section-label {
		display: block;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-neutral-500);
		margin-bottom: 0.75rem;
	}

	/* Bond Section */
	.bond-section {
		padding: 1rem;
		background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 5%, transparent), color-mix(in srgb, var(--ctp-mauve) 5%, transparent));
		border-radius: 1rem;
		border: 1px solid color-mix(in srgb, var(--accent) 15%, transparent);
	}

	.bond-progress {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.affection-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
	}

	.heart-glow {
		display: flex;
		filter: drop-shadow(0 0 4px color-mix(in srgb, var(--ctp-pink) 50%, transparent));
	}

	.tier-name {
		font-weight: 600;
		color: var(--color-neutral-700);
	}

	.affection-value {
		margin-left: auto;
		color: var(--color-neutral-500);
		font-size: 0.7rem;
	}

	.bond-stage {
		display: block;
		font-size: 0.75rem;
		color: var(--color-neutral-600);
	}

	/* Stats Section */
	.stats-section {
		padding: 1rem;
		background: var(--color-neutral-100);
		border-radius: 0.75rem;
	}

	.stat-bars {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.stat-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.stat-info {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		width: 90px;
		flex-shrink: 0;
	}

	.stat-name {
		font-size: 0.8rem;
		color: var(--color-neutral-700);
	}

	.stat-track {
		flex: 1;
		height: 8px;
		background: var(--color-neutral-200);
		border-radius: 4px;
		overflow: hidden;
	}

	.stat-fill {
		height: 100%;
		border-radius: 4px;
		transition: width 0.3s ease-out;
	}

	/* Stat bar colors */
	.stat-bar--trust .stat-info { color: var(--stat-trust); }
	.stat-bar--trust .stat-fill { background: var(--stat-trust); }

	.stat-bar--intimacy .stat-info { color: var(--stat-intimacy); }
	.stat-bar--intimacy .stat-fill { background: var(--stat-intimacy); }

	.stat-bar--comfort .stat-info { color: var(--stat-comfort); }
	.stat-bar--comfort .stat-fill { background: var(--stat-comfort); }

	.stat-bar--respect .stat-info { color: var(--stat-respect); }
	.stat-bar--respect .stat-fill { background: var(--stat-respect); }

	.stat-bar--energy .stat-info { color: var(--stat-energy); }
	.stat-bar--energy .stat-fill { background: var(--stat-energy); }

	.stat-value {
		width: 40px;
		text-align: right;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-neutral-700);
	}

	/* Mood Section */
	.mood-section {
		padding: 1rem;
		background: var(--color-neutral-100);
		border-radius: 0.75rem;
	}

	.mood-display {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.mood-icon-lg {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		background: color-mix(in srgb, var(--mood-color, var(--accent)) 15%, transparent);
		border-radius: 50%;
		color: var(--mood-color, var(--accent));
	}

	.mood-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.mood-name {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-neutral-800);
	}

	.mood-cause {
		font-size: 0.75rem;
		color: var(--color-neutral-500);
		font-style: italic;
	}

	/* Activity Section */
	.activity-section {
		padding: 1rem;
		background: var(--color-neutral-100);
		border-radius: 0.75rem;
	}

	.activity-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
	}

	.activity-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem 0.5rem;
		background: var(--color-neutral-50);
		border-radius: 0.5rem;
	}

	.activity-value {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-neutral-800);
	}

	.activity-label {
		font-size: 0.65rem;
		color: var(--color-neutral-500);
		text-transform: uppercase;
	}

	/* Activity item colors */
	.activity-item--streak { color: var(--ctp-peach); }
	.activity-item--best { color: var(--ctp-yellow); }
	.activity-item--chats { color: var(--ctp-blue); }
	.activity-item--days { color: var(--ctp-mauve); }

	.activity-item .activity-value,
	.activity-item .activity-label {
		color: var(--color-neutral-800);
	}

	.activity-item .activity-label {
		color: var(--color-neutral-500);
	}

	/* Events Section (collapsible) */
	.events-section {
		background: var(--color-neutral-100);
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.events-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.875rem 1rem;
		background: transparent;
		border: none;
		color: var(--color-neutral-700);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}

	.events-toggle:hover {
		background: var(--color-neutral-200);
	}

	.events-toggle span:first-of-type {
		flex: 1;
		text-align: left;
	}

	.events-count {
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--ctp-yellow);
		background: color-mix(in srgb, var(--ctp-yellow) 15%, transparent);
		padding: 0.125rem 0.5rem;
		border-radius: 1rem;
	}

	.events-content {
		padding: 0 1rem 1rem;
	}

	.events-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.event-card {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.625rem 0.75rem;
		background: var(--color-neutral-50);
		border-radius: 0.5rem;
		border-left: 3px solid var(--event-color);
		transition: all 0.15s ease;
	}

	.event-card:hover {
		background: var(--color-neutral-200);
	}

	.event-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: color-mix(in srgb, var(--event-bg) 15%, transparent);
		border-radius: 0.375rem;
		color: var(--event-color);
		flex-shrink: 0;
	}

	.event-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.event-name {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--color-neutral-800);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.event-meta {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.65rem;
	}

	.event-type {
		color: var(--event-color);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.event-date {
		color: var(--color-neutral-500);
	}

	.event-date::before {
		content: '•';
		margin-right: 0.375rem;
		opacity: 0.5;
	}

	.event-check {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		background: color-mix(in srgb, var(--ctp-green) 15%, transparent);
		border-radius: 50%;
		color: var(--ctp-green);
		flex-shrink: 0;
	}

	.events-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem 1rem;
		color: var(--color-neutral-400);
		text-align: center;
	}

	.events-empty span {
		font-size: 0.8rem;
		color: var(--color-neutral-600);
	}

	.events-hint {
		font-size: 0.7rem !important;
		color: var(--color-neutral-500) !important;
	}

	/* AI Services Section */
	.services-section {
		background: var(--color-neutral-100);
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.services-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.875rem 1rem;
		background: transparent;
		border: none;
		color: var(--color-neutral-700);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s;
	}

	.services-toggle:hover {
		background: var(--color-neutral-200);
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

	.service-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-neutral-500);
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
		background: var(--color-neutral-300);
		border-radius: 11px;
		transition: background 0.2s ease;
	}

	.service-toggle.enabled .toggle-track {
		background: var(--ctp-green);
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 18px;
		height: 18px;
		background: white;
		border-radius: 50%;
		transition: transform 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.service-toggle.enabled .toggle-thumb {
		transform: translateX(18px);
	}

	.api-key-row {
		display: flex;
		gap: 0.5rem;
	}

	.api-key-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		background: var(--color-neutral-50);
		border: 1px solid var(--color-neutral-300);
		border-radius: 0.5rem;
		font-size: 0.8rem;
		font-family: ui-monospace, monospace;
	}

	.api-key-input:focus {
		outline: none;
		border-color: var(--ctp-pink);
	}

	/* Upload Modal */
	.upload-modal {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 2rem;
	}

	.upload-content {
		background: var(--color-background);
		border-radius: 1rem;
		max-width: 400px;
		width: 100%;
		overflow: hidden;
	}

	.upload-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--color-neutral-200);
	}

	.upload-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-neutral-900);
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: transparent;
		border: none;
		color: var(--color-neutral-600);
		cursor: pointer;
		border-radius: 0.375rem;
	}

	.close-btn:hover {
		background: var(--color-neutral-100);
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
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 2rem;
	}

	.confirm-content {
		background: var(--color-background);
		border-radius: 1rem;
		max-width: 360px;
		width: 100%;
		padding: 1.5rem;
		text-align: center;
	}

	.confirm-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		background: color-mix(in srgb, var(--ctp-peach) 15%, transparent);
		border-radius: 50%;
		color: var(--ctp-peach);
		margin-bottom: 1rem;
	}

	.confirm-title {
		margin: 0 0 0.75rem;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-neutral-900);
	}

	.confirm-message {
		margin: 0 0 1.5rem;
		font-size: 0.875rem;
		color: var(--color-neutral-600);
		line-height: 1.5;
	}

	.confirm-actions {
		display: flex;
		gap: 0.75rem;
	}

	.confirm-btn {
		flex: 1;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.confirm-btn--cancel {
		background: var(--color-neutral-100);
		border: 1px solid var(--color-neutral-200);
		color: var(--color-neutral-700);
	}

	.confirm-btn--cancel:hover {
		background: var(--color-neutral-200);
	}

	.confirm-btn--confirm {
		background: var(--accent);
		border: 1px solid var(--accent);
		color: var(--accent-foreground);
	}

	.confirm-btn--confirm:hover {
		filter: brightness(1.1);
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
			grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
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
			grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
			gap: 0.5rem;
		}

		.model-card {
			padding: 0.375rem;
		}

		.model-name {
			font-size: 0.6rem;
		}

		.stat-info {
			width: 75px;
		}

		.stat-name {
			font-size: 0.75rem;
		}
	}
</style>
