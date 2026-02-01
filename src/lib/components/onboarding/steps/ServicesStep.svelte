<script lang="ts">
	import { Icon, ProviderDropdown, ModelDropdown } from '$lib/components/ui';
	import { modulesStore } from '$lib/stores/modules.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { getLLMProvider, getTTSProvider } from '$lib/services/providers/registry';
	import {
		fetchModels,
		getCachedModelsForProvider,
		debounce,
		type ModelInfo
	} from '$lib/services/providers/use-model-fetch';

	interface Props {
		onNext: () => void;
		onBack: () => void;
	}

	let { onNext, onBack }: Props = $props();

	// LLM State
	const llmSettings = $derived(modulesStore.getModuleSettings('consciousness'));
	const llmProvider = $derived(getLLMProvider(llmSettings.activeProvider as string));
	const staticLLMModels = $derived(llmProvider?.models ?? []);

	// Dynamic model fetching state for LLM
	let llmIsLoading = $state(false);
	let llmFetchError = $state<string | null>(null);
	let llmDynamicModels = $state<ModelInfo[] | null>(null);

	// Use dynamic models if available, otherwise static
	const llmModels = $derived(llmDynamicModels ?? staticLLMModels);

	// Check if API key is present for current LLM provider
	const llmHasApiKey = $derived.by(() => {
		if (!llmProvider) return false;
		if (llmProvider.isLocal || !llmProvider.requiresApiKey) return true;
		const config = settingsStore.getProviderConfig(llmProvider.id);
		return !!config.apiKey;
	});

	// TTS State
	let ttsEnabled = $state(false);
	const ttsSettings = $derived(modulesStore.getModuleSettings('speech'));
	const ttsProvider = $derived(getTTSProvider(ttsSettings.activeProvider as string));
	const staticTTSModels = $derived(ttsProvider?.models ?? []);

	// Dynamic model fetching state for TTS
	let ttsIsLoading = $state(false);
	let ttsFetchError = $state<string | null>(null);
	let ttsDynamicModels = $state<ModelInfo[] | null>(null);

	// Use dynamic models if available, otherwise static
	const ttsModels = $derived(ttsDynamicModels ?? staticTTSModels);

	// Check if API key is present for current TTS provider
	const ttsHasApiKey = $derived.by(() => {
		if (!ttsProvider) return false;
		if (ttsProvider.isLocal || !ttsProvider.requiresApiKey) return true;
		const config = settingsStore.getProviderConfig(ttsProvider.id);
		return !!config.apiKey;
	});

	// Validation
	const isLLMConfigured = $derived.by(() => {
		if (!llmSettings.activeProvider) return false;
		const provider = getLLMProvider(llmSettings.activeProvider as string);
		if (!provider) return false;
		if (provider.isLocal) return true;
		if (!provider.requiresApiKey) return true;
		const config = settingsStore.getProviderConfig(provider.id);
		return !!config.apiKey;
	});

	// Fetch LLM models from provider API
	async function fetchLLMModels() {
		const targetProvider = llmProvider?.id;
		if (!targetProvider) return;

		const config = settingsStore.getProviderConfig(targetProvider);

		await fetchModels({
			providerId: targetProvider,
			apiKey: config.apiKey ?? '',
			baseUrl: config.baseUrl,
			isLocal: llmProvider?.isLocal,
			getCurrentProviderId: () => llmProvider?.id,
			onStart: () => {
				llmIsLoading = true;
				llmFetchError = null;
			},
			onSuccess: (models) => {
				llmIsLoading = false;
				llmDynamicModels = models;
				// Auto-select first model if none selected
				if (!llmSettings.activeModel && models.length > 0) {
					modulesStore.setModuleSetting('consciousness', 'activeModel', models[0].id);
				}
			},
			onError: () => {
				llmIsLoading = false;
				llmFetchError = 'Using default list';
				llmDynamicModels = null;
			},
			onEmpty: () => {
				llmIsLoading = false;
				llmDynamicModels = null;
			},
			onStale: () => {
				llmIsLoading = false;
			}
		});
	}

	// Fetch TTS models from provider API
	async function fetchTTSModels() {
		const targetProvider = ttsProvider?.id;
		if (!targetProvider) return;

		const config = settingsStore.getProviderConfig(targetProvider);

		await fetchModels({
			providerId: targetProvider,
			apiKey: config.apiKey ?? '',
			baseUrl: config.baseUrl,
			isLocal: ttsProvider?.isLocal,
			getCurrentProviderId: () => ttsProvider?.id,
			onStart: () => {
				ttsIsLoading = true;
				ttsFetchError = null;
			},
			onSuccess: (models) => {
				ttsIsLoading = false;
				ttsDynamicModels = models;
				// Auto-select first model if none selected
				if (!ttsSettings.activeModel && models.length > 0) {
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

	// Handlers
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

	function handleLLMApiKeyChange(apiKey: string) {
		if (llmProvider) {
			llmFetchError = null; // Clear error when user types
			settingsStore.setProviderConfig(llmProvider.id, { apiKey });
			if (apiKey) {
				settingsStore.markProviderAdded(llmProvider.id);
			}
		}
	}

	function handleLLMApiKeyBlur() {
		const config = settingsStore.getProviderConfig(llmProvider?.id ?? '');
		if (config.apiKey && llmProvider && !llmProvider.isLocal) {
			debouncedFetchLLMModels();
		}
	}

	function handleLLMBaseUrlChange(baseUrl: string) {
		if (llmProvider) {
			settingsStore.setProviderConfig(llmProvider.id, { baseUrl });
		}
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
		// Mark local providers as added immediately (they don't need API keys)
		if (provider?.isLocal || !provider?.requiresApiKey) {
			settingsStore.markProviderAdded(providerId);
		}
	}

	function handleTTSModelChange(modelId: string) {
		modulesStore.setModuleSetting('speech', 'activeModel', modelId);
	}

	function handleTTSApiKeyChange(apiKey: string) {
		if (ttsProvider) {
			ttsFetchError = null; // Clear error when user types
			settingsStore.setProviderConfig(ttsProvider.id, { apiKey });
			if (apiKey) {
				settingsStore.markProviderAdded(ttsProvider.id);
			}
		}
	}

	function handleTTSApiKeyBlur() {
		const config = settingsStore.getProviderConfig(ttsProvider?.id ?? '');
		if (config.apiKey && ttsProvider && !ttsProvider.isLocal) {
			debouncedFetchTTSModels();
		}
	}

	function handleTTSBaseUrlChange(baseUrl: string) {
		if (ttsProvider) {
			settingsStore.setProviderConfig(ttsProvider.id, { baseUrl });
		}
	}

	function handleNext() {
		modulesStore.setModuleEnabled('consciousness', true);
		if (ttsEnabled && ttsSettings.activeProvider) {
			modulesStore.setModuleEnabled('speech', true);
		}
		onNext();
	}
</script>

<div class="step-content">
	<div class="step-header">
		<Icon name="settings" size={24} />
		<h2 class="title">Configure AI Services</h2>
		<p class="subtitle">Set up your LLM for chat (required) and TTS for speech (optional)</p>
	</div>

	<div class="security-note">
		<Icon name="lock" size={14} />
		<span>Your API keys are stored locally in your browser. We never store them on our servers.</span>
	</div>

	<!-- LLM Section -->
	<div class="service-section">
		<div class="service-header">
			<Icon name="brain" size={16} />
			<span class="service-title">Chat (LLM)</span>
			<span class="required-badge">Required</span>
		</div>

		<ProviderDropdown
			type="llm"
			value={llmSettings.activeProvider as string}
			onSelect={handleLLMProviderChange}
			placeholder="Select LLM provider..."
		/>

		{#if llmProvider?.requiresApiKey}
			<input
				type="password"
				class="api-key-input"
				class:error={llmFetchError}
				placeholder="Enter API Key..."
				value={settingsStore.getProviderConfig(llmProvider.id).apiKey ?? ''}
				oninput={(e) => handleLLMApiKeyChange(e.currentTarget.value)}
				onblur={handleLLMApiKeyBlur}
			/>
		{/if}

		{#if llmSettings.activeProvider && !llmProvider?.isLocal}
			<ModelDropdown
				models={llmModels}
				value={llmSettings.activeModel as string}
				onSelect={handleLLMModelChange}
				placeholder="Select model..."
				isLoading={llmIsLoading}
				onRefresh={llmHasApiKey ? fetchLLMModels : undefined}
				disabled={!llmHasApiKey}
				disabledMessage="Enter API key first"
			/>
		{/if}

		{#if llmProvider?.isLocal}
			<input
				type="text"
				class="api-key-input"
				placeholder="Model name (e.g., llama3.2:latest)"
				value={llmSettings.activeModel as string ?? ''}
				oninput={(e) => handleLLMModelChange(e.currentTarget.value)}
			/>
		{/if}

		{#if llmProvider?.isLocal}
			<input
				type="text"
				class="api-key-input"
				placeholder={llmProvider.defaultBaseUrl || 'http://localhost:11434/v1/'}
				value={settingsStore.getProviderConfig(llmProvider.id).baseUrl ?? ''}
				oninput={(e) => handleLLMBaseUrlChange(e.currentTarget.value)}
			/>
			<p class="provider-note">
				<Icon name="check-circle" size={14} />
				Local provider - no API key needed
			</p>
		{/if}
	</div>

	<!-- TTS Section -->
	<div class="service-section">
		<div class="service-header">
			<Icon name="mic" size={16} />
			<span class="service-title">Speech (TTS)</span>
			<span class="optional-badge">Optional</span>
			<button class="toggle-btn" class:enabled={ttsEnabled} onclick={() => ttsEnabled = !ttsEnabled} aria-label="Toggle TTS">
				<span class="toggle-track">
					<span class="toggle-thumb"></span>
				</span>
			</button>
		</div>

		{#if ttsEnabled}
			<ProviderDropdown
				type="tts"
				value={ttsSettings.activeProvider as string}
				onSelect={handleTTSProviderChange}
				placeholder="Select TTS provider..."
			/>

			{#if ttsProvider?.requiresApiKey}
				<input
					type="password"
					class="api-key-input"
					class:error={ttsFetchError}
					placeholder="Enter API Key..."
					value={settingsStore.getProviderConfig(ttsProvider.id).apiKey ?? ''}
					oninput={(e) => handleTTSApiKeyChange(e.currentTarget.value)}
					onblur={handleTTSApiKeyBlur}
				/>
			{/if}

			{#if ttsSettings.activeProvider && !ttsProvider?.isLocal}
				<ModelDropdown
					models={ttsModels}
					value={ttsSettings.activeModel as string}
					onSelect={handleTTSModelChange}
					placeholder="Select model..."
					isLoading={ttsIsLoading}
					onRefresh={ttsHasApiKey ? fetchTTSModels : undefined}
					disabled={!ttsHasApiKey}
					disabledMessage="Enter API key first"
				/>
			{/if}

			{#if ttsSettings.activeProvider === 'elevenlabs'}
				<input
					type="text"
					class="api-key-input"
					placeholder="Custom Voice ID (optional)"
					value={settingsStore.elevenLabsVoiceId}
					oninput={(e) => settingsStore.setElevenLabsVoiceId(e.currentTarget.value)}
				/>
			{/if}

			{#if ttsProvider?.isLocal}
				<input
					type="text"
					class="api-key-input"
					placeholder="Model/voice name"
					value={ttsSettings.activeModel as string ?? ''}
					oninput={(e) => handleTTSModelChange(e.currentTarget.value)}
				/>
			{/if}

			{#if ttsProvider?.isLocal}
				<input
					type="text"
					class="api-key-input"
					placeholder={ttsProvider.defaultBaseUrl || 'http://localhost:5000/'}
					value={settingsStore.getProviderConfig(ttsProvider.id).baseUrl ?? ''}
					oninput={(e) => handleTTSBaseUrlChange(e.currentTarget.value)}
				/>
				<p class="provider-note">
					<Icon name="check-circle" size={14} />
					Local provider - no API key needed
				</p>
			{/if}
		{:else}
			<p class="skip-note">Enable to add voice to your companion</p>
		{/if}
	</div>

	<div class="actions">
		<button class="back-btn" onclick={onBack}>
			<Icon name="chevron-left" size={16} />
			Back
		</button>
		<button class="next-btn" onclick={handleNext} disabled={!isLLMConfigured}>
			Next
			<Icon name="chevron-right" size={16} />
		</button>
	</div>
</div>

<style>
	.step-content {
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
		gap: 1.25rem;
		max-height: 70vh;
		overflow-y: auto;
	}

	.step-header {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-secondary);
	}

	.title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		letter-spacing: -0.02em;
	}

	.subtitle {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.security-note {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background: linear-gradient(180deg, #4ade80 0%, #22c55e 50%, #16a34a 100%);
		border-radius: var(--radius-md);
		font-size: 0.75rem;
		color: white;
		box-shadow:
			0 2px 8px rgba(34, 197, 94, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
	}

	.service-section {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 1rem;
		background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: var(--radius-md);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.06),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	:global(.dark) .service-section {
		background: linear-gradient(180deg, #252525 0%, #1a1a1a 100%);
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.service-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-secondary);
	}

	.service-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.required-badge {
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		color: white;
		background: linear-gradient(180deg, #fb7185 0%, #ef4444 50%, #dc2626 100%);
		padding: 0.2rem 0.5rem;
		border-radius: var(--radius-full);
		margin-left: auto;
		box-shadow:
			0 1px 3px rgba(239, 68, 68, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.25);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
	}

	.optional-badge {
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--text-secondary);
		background: linear-gradient(180deg, #f0f0f0 0%, #e0e0e0 100%);
		padding: 0.2rem 0.5rem;
		border-radius: var(--radius-full);
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	:global(.dark) .optional-badge {
		background: linear-gradient(180deg, #404040 0%, #333333 100%);
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.toggle-btn {
		margin-left: auto;
		position: relative;
		width: 42px;
		height: 24px;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.toggle-track {
		display: block;
		width: 100%;
		height: 100%;
		background: linear-gradient(180deg, #c8c8c8 0%, #e0e0e0 100%);
		border-radius: 12px;
		transition: all 0.2s;
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.15),
			inset 0 1px 2px rgba(0, 0, 0, 0.1),
			0 1px 0 rgba(255, 255, 255, 0.8);
	}

	:global(.dark) .toggle-track {
		background: linear-gradient(180deg, #2a2a2a 0%, #3a3a3a 100%);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.4),
			inset 0 1px 2px rgba(0, 0, 0, 0.3),
			0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.toggle-btn.enabled .toggle-track {
		background: linear-gradient(180deg, #4ade80 0%, #22c55e 50%, #16a34a 100%);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.1),
			0 0 8px rgba(34, 197, 94, 0.4),
			0 1px 0 rgba(255, 255, 255, 0.3);
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 20px;
		height: 20px;
		background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
		border-radius: 50%;
		transition: transform 0.2s;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	.toggle-btn.enabled .toggle-thumb {
		transform: translateX(18px);
	}

	.api-key-input {
		padding: 0.75rem 1rem;
		background: linear-gradient(180deg, #f5f5f5 0%, #ffffff 100%);
		border: 1px solid rgba(0, 0, 0, 0.12);
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		font-family: ui-monospace, monospace;
		color: var(--text-primary);
		transition: all 0.2s;
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.06),
			inset 0 1px 2px rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .api-key-input {
		background: linear-gradient(180deg, #1a1a1a 0%, #222222 100%);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.3),
			inset 0 1px 2px rgba(0, 0, 0, 0.2);
	}

	.api-key-input::placeholder {
		color: var(--text-tertiary);
	}

	.api-key-input:focus {
		outline: none;
		border-color: #01B2FF;
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.06),
			0 0 0 3px rgba(1, 178, 255, 0.2),
			0 0 12px rgba(1, 178, 255, 0.15);
	}

	:global(.dark) .api-key-input:focus {
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.3),
			0 0 0 3px rgba(1, 178, 255, 0.25),
			0 0 16px rgba(1, 178, 255, 0.2);
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

	.provider-note {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-success);
	}

	.skip-note {
		margin: 0;
		font-size: 0.8rem;
		color: var(--text-tertiary);
		font-style: italic;
	}

	.actions {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.back-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.75rem 1.25rem;
		background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	.back-btn:hover {
		background: linear-gradient(180deg, #f8f8f8 0%, #e8e8e8 100%);
		color: var(--text-primary);
		transform: translateY(-1px);
		box-shadow:
			0 4px 8px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	.back-btn:active {
		transform: translateY(0);
		background: linear-gradient(180deg, #e8e8e8 0%, #e0e0e0 100%);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .back-btn {
		background: linear-gradient(180deg, #333333 0%, #262626 100%);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	:global(.dark) .back-btn:hover {
		background: linear-gradient(180deg, #404040 0%, #333333 100%);
	}

	.next-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 40%, #0099dd 100%);
		color: white;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow:
			0 4px 12px rgba(1, 178, 255, 0.35),
			0 2px 4px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
	}

	.next-btn:hover:not(:disabled) {
		background: linear-gradient(180deg, #66d9ff 0%, #1ebfff 40%, #00a6e6 100%);
		transform: translateY(-2px);
		box-shadow:
			0 6px 18px rgba(1, 178, 255, 0.45),
			0 3px 6px rgba(0, 0, 0, 0.12),
			inset 0 1px 0 rgba(255, 255, 255, 0.5);
	}

	.next-btn:active:not(:disabled) {
		transform: translateY(0);
		background: linear-gradient(180deg, #0099dd 0%, #0088cc 100%);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.next-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
