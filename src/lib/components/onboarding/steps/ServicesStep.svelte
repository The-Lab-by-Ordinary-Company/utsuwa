<script lang="ts">
	import { Icon, ProviderDropdown, ModelDropdown } from '$lib/components/ui';
	import { modulesStore } from '$lib/stores/modules.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { getLLMProvider, getTTSProvider } from '$lib/services/providers/registry';
	import { fetchProviderModels, type ModelInfo } from '$lib/services/providers/model-fetcher';

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

	// Fetch models from provider API
	async function fetchLLMModels() {
		const targetProvider = llmProvider?.id;
		if (!targetProvider || llmProvider.isLocal) return;

		const config = settingsStore.getProviderConfig(targetProvider);
		if (!config.apiKey) return;

		llmIsLoading = true;
		llmFetchError = null;

		const result = await fetchProviderModels(
			targetProvider,
			config.apiKey,
			config.baseUrl
		);

		// Provider changed during fetch - discard stale results
		if (llmProvider?.id !== targetProvider) return;

		llmIsLoading = false;

		if (result.error) {
			llmFetchError = 'Using default list';
			llmDynamicModels = null;
		} else if (result.models.length > 0) {
			llmDynamicModels = result.models;
			settingsStore.setCachedModels(targetProvider, result.models);
			// Auto-select first model if none selected
			if (!llmSettings.activeModel && result.models.length > 0) {
				modulesStore.setModuleSetting('consciousness', 'activeModel', result.models[0].id);
			}
		} else {
			// Empty but not an error - silently fall back to static models
			llmDynamicModels = null;
		}
	}

	// Fetch TTS models from provider API
	async function fetchTTSModels() {
		const targetProvider = ttsProvider?.id;
		if (!targetProvider || ttsProvider.isLocal) return;

		const config = settingsStore.getProviderConfig(targetProvider);
		if (!config.apiKey) return;

		ttsIsLoading = true;
		ttsFetchError = null;

		const result = await fetchProviderModels(
			targetProvider,
			config.apiKey,
			config.baseUrl
		);

		// Provider changed during fetch - discard stale results
		if (ttsProvider?.id !== targetProvider) return;

		ttsIsLoading = false;

		if (result.error) {
			ttsFetchError = 'Using default list';
			ttsDynamicModels = null;
		} else if (result.models.length > 0) {
			ttsDynamicModels = result.models;
			settingsStore.setCachedModels(targetProvider, result.models);
			// Auto-select first model if none selected
			if (!ttsSettings.activeModel && result.models.length > 0) {
				modulesStore.setModuleSetting('speech', 'activeModel', result.models[0].id);
			}
		} else {
			// Empty but not an error - silently fall back to static models
			ttsDynamicModels = null;
		}
	}

	// Handlers
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

	function handleLLMApiKeyChange(apiKey: string) {
		if (llmProvider) {
			settingsStore.setProviderConfig(llmProvider.id, { apiKey });
			if (apiKey) {
				settingsStore.markProviderAdded(llmProvider.id);
			}
		}
	}

	function handleLLMApiKeyBlur() {
		const config = settingsStore.getProviderConfig(llmProvider?.id ?? '');
		if (config.apiKey && llmProvider && !llmProvider.isLocal) {
			fetchLLMModels();
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

	function handleTTSApiKeyChange(apiKey: string) {
		if (ttsProvider) {
			settingsStore.setProviderConfig(ttsProvider.id, { apiKey });
			if (apiKey) {
				settingsStore.markProviderAdded(ttsProvider.id);
			}
		}
	}

	function handleTTSApiKeyBlur() {
		const config = settingsStore.getProviderConfig(ttsProvider?.id ?? '');
		if (config.apiKey && ttsProvider && !ttsProvider.isLocal) {
			fetchTTSModels();
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
				fetchError={llmFetchError}
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
					fetchError={ttsFetchError}
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
		padding: 1.25rem;
		gap: 1rem;
		max-height: 70vh;
		overflow-y: auto;
	}

	.step-header {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		color: var(--accent);
	}

	.title {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-neutral-900);
		margin: 0;
	}

	.subtitle {
		font-size: 0.8rem;
		color: var(--color-neutral-600);
		margin: 0;
	}

	.security-note {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem 0.875rem;
		background: color-mix(in srgb, var(--ctp-green) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--ctp-green) 30%, transparent);
		border-radius: 0.5rem;
		font-size: 0.7rem;
		color: var(--ctp-green);
	}

	.service-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.875rem;
		background: var(--color-neutral-100);
		border-radius: 0.625rem;
	}

	.service-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-neutral-700);
	}

	.service-title {
		font-size: 0.8rem;
		font-weight: 600;
	}

	.required-badge {
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--ctp-red);
		background: color-mix(in srgb, var(--ctp-red) 15%, transparent);
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		margin-left: auto;
	}

	.optional-badge {
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--color-neutral-500);
		background: var(--color-neutral-200);
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
	}

	.toggle-btn {
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
		transition: background 0.2s;
	}

	.toggle-btn.enabled .toggle-track {
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
		transition: transform 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.toggle-btn.enabled .toggle-thumb {
		transform: translateX(18px);
	}

	.api-key-input {
		padding: 0.625rem 0.75rem;
		background: var(--color-neutral-50);
		border: 1px solid var(--color-neutral-200);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-family: ui-monospace, monospace;
		color: var(--color-neutral-900);
	}

	.api-key-input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.provider-note {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin: 0;
		font-size: 0.7rem;
		color: var(--ctp-green);
	}

	.skip-note {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-neutral-500);
		font-style: italic;
	}

	.actions {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 0.25rem;
	}

	.back-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.625rem 1rem;
		background: var(--color-neutral-100);
		border: 1px solid var(--color-neutral-200);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-neutral-700);
		cursor: pointer;
		transition: all 0.15s;
	}

	.back-btn:hover {
		background: var(--color-neutral-200);
	}

	.next-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.625rem 1.25rem;
		background: var(--accent);
		color: var(--accent-foreground);
		border: none;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.next-btn:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.next-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
