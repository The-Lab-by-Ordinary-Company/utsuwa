<script lang="ts">
	import { Icon, ProviderDropdown, ModelDropdown, ContextSizeSlider } from '$lib/components/ui';
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

	function handleContextSizeChange(value: number | undefined) {
		modulesStore.setModuleSetting('consciousness', 'contextSize', value);
	}

	// LLM State
	const llmSettings = $derived(modulesStore.getModuleSettings('consciousness'));
	const llmProvider = $derived(getLLMProvider(llmSettings.activeProvider as string));
	const staticLLMModels = $derived(llmProvider?.models ?? []);
	const llmContextSize = $derived(llmSettings.contextSize as number | undefined);

	// Dynamic model fetching state for LLM
	let llmIsLoading = $state(false);
	let llmFetchError = $state<string | null>(null);
	let llmDynamicModels = $state<ModelInfo[] | null>(null);
	let lastLocalLLMFetchKey = $state('');

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

	// STT (voice input) is config-based, not a module. A configured local server
	// wins, then Groq, then OpenAI, then the browser's Web Speech API.
	let sttEnabled = $state(false);
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
		if (provider.isLocal) {
			const activeModel = llmSettings.activeModel as string;
			return !!activeModel && llmModels.some((model) => model.id === activeModel);
		}
		// Custom endpoints need a base URL and a hand-entered model to work.
		if (provider.custom) {
			const config = settingsStore.getProviderConfig(provider.id);
			return !!config.baseUrl && !!(llmSettings.activeModel as string);
		}
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
				const currentModel = llmSettings.activeModel as string;
				const modelExists = models.some((m) => m.id === currentModel);
				if (!currentModel || !modelExists) {
					modulesStore.setModuleSetting('consciousness', 'activeModel', models[0].id);
				}
			},
			onError: (error) => {
				llmIsLoading = false;
				llmFetchError = error ?? 'Could not fetch installed models';
				llmDynamicModels = llmProvider?.isLocal ? [] : null;
			},
			onEmpty: () => {
				llmIsLoading = false;
				llmFetchError = llmProvider?.isLocal
					? 'No installed models found. Pull a model, then refresh.'
					: null;
				llmDynamicModels = llmProvider?.isLocal ? [] : null;
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

	$effect(() => {
		if (!llmProvider?.isLocal) {
			lastLocalLLMFetchKey = '';
			return;
		}

		const baseUrl = settingsStore.getProviderConfig(llmProvider.id).baseUrl ?? llmProvider.defaultBaseUrl ?? '';
		const fetchKey = `${llmProvider.id}:${baseUrl}`;

		if (fetchKey !== lastLocalLLMFetchKey) {
			lastLocalLLMFetchKey = fetchKey;
			debouncedFetchLLMModels();
		}
	});

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
			llmFetchError = null;
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

<div class="ob-step services-step">
	<div class="ob-head">
		<h2 class="ob-title">Configure AI services</h2>
		<p class="ob-subtitle">Set up chat (required), plus speech and voice input (optional).</p>
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

		{#if llmProvider?.requiresApiKey || llmProvider?.custom}
			<input
				type="password"
				class="api-key-input"
				class:error={llmFetchError}
				placeholder={llmProvider?.custom ? 'API Key (optional)' : 'Enter API Key...'}
				value={settingsStore.getProviderConfig(llmProvider.id).apiKey ?? ''}
				oninput={(e) => handleLLMApiKeyChange(e.currentTarget.value)}
				onblur={llmProvider?.custom ? undefined : handleLLMApiKeyBlur}
			/>
		{/if}

		<!-- Base URL for local providers and custom OpenAI-compatible endpoints -->
		{#if llmProvider?.isLocal || llmProvider?.custom}
			{#if llmProvider.isLocal && llmFetchError}
				<p class="provider-note error">
					<Icon name="alert-circle" size={14} />
					{llmFetchError}
				</p>
			{/if}
			<input
				type="text"
				class="api-key-input"
				placeholder={llmProvider.custom
					? 'https://api.openai.com/v1/ or your endpoint'
					: llmProvider.defaultBaseUrl || 'http://localhost:11434/v1/'}
				value={settingsStore.getProviderConfig(llmProvider.id).baseUrl ?? ''}
				oninput={(e) => handleLLMBaseUrlChange(e.currentTarget.value)}
				onblur={llmProvider.custom ? undefined : fetchLLMModels}
			/>
			{#if llmProvider.isLocal}
				<p class="provider-note">
					<Icon name="check-circle" size={14} />
					Local provider - no API key needed
				</p>
			{/if}
		{/if}

		<!-- Model: manual entry for custom endpoints, discovered dropdown otherwise -->
		{#if llmProvider?.custom}
			{@const customConfig = settingsStore.getProviderConfig(llmProvider.id)}
			<input
				type="text"
				class="api-key-input"
				placeholder="Model (e.g. gpt-4o-mini, meta-llama/llama-3-70b)"
				value={(llmSettings.activeModel as string) ?? ''}
				oninput={(e) => handleLLMModelChange(e.currentTarget.value.trim())}
			/>
			{#if customConfig.baseUrl}
				<ModelDropdown
					models={llmModels}
					value={llmSettings.activeModel as string}
					onSelect={handleLLMModelChange}
					placeholder="Pick a fetched model..."
					isLoading={llmIsLoading}
					onRefresh={fetchLLMModels}
					disabled={false}
				/>
			{:else}
				<p class="provider-note">Enter a base URL to fetch available models.</p>
			{/if}
		{:else if llmSettings.activeProvider}
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

		<!-- Context Window -->
		<ContextSizeSlider
			contextSize={llmContextSize}
			onChange={handleContextSizeChange}
			id="ob-llm-context-size-toggle"
		/>
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

	<!-- STT Section -->
	<div class="service-section">
		<div class="service-header">
			<Icon name="mic" size={16} />
			<span class="service-title">Voice Input (STT)</span>
			<span class="optional-badge">Optional</span>
			<button class="toggle-btn" class:enabled={sttEnabled} onclick={() => sttEnabled = !sttEnabled} aria-label="Toggle voice input (STT)">
				<span class="toggle-track">
					<span class="toggle-thumb"></span>
				</span>
			</button>
		</div>

		{#if sttEnabled}
			<p class="skip-note">Transcribe your voice with Whisper. A local server is used if set, then Groq, then OpenAI, otherwise your browser's built-in recognition.</p>

			<input
				type="text"
				class="api-key-input"
				placeholder="Local server URL (http://localhost:8000/v1/)"
				value={settingsStore.getProviderConfig('local-stt').baseUrl ?? ''}
				oninput={(e) => {
					const v = e.currentTarget.value.trim();
					settingsStore.setProviderConfig('local-stt', { baseUrl: v });
					if (v) settingsStore.markProviderAdded('local-stt');
					else settingsStore.removeProvider('local-stt');
				}}
			/>

			<input
				type="text"
				class="api-key-input"
				placeholder="Local model (optional, e.g. Systran/faster-whisper-large-v3)"
				value={settingsStore.getProviderConfig('local-stt').modelId ?? ''}
				oninput={(e) => settingsStore.setProviderConfig('local-stt', { modelId: e.currentTarget.value.trim() })}
			/>

			<input
				type="password"
				class="api-key-input"
				placeholder="Groq API Key (optional)"
				value={settingsStore.getProviderConfig('groq-stt').apiKey ?? ''}
				oninput={(e) => {
					settingsStore.setProviderConfig('groq-stt', { apiKey: e.currentTarget.value });
					settingsStore.markProviderAdded('groq-stt');
				}}
			/>

			<input
				type="password"
				class="api-key-input"
				placeholder="OpenAI API Key — Whisper (optional)"
				value={settingsStore.getProviderConfig('openai-stt').apiKey ?? ''}
				oninput={(e) => {
					settingsStore.setProviderConfig('openai-stt', { apiKey: e.currentTarget.value });
					settingsStore.markProviderAdded('openai-stt');
				}}
			/>
		{:else}
			<p class="skip-note">Enable to set up microphone voice input</p>
		{/if}
	</div>

	<div class="ob-actions ob-actions--split">
		<button class="btn btn-secondary" onclick={onBack}>
			<Icon name="chevron-left" size={16} />
			Back
		</button>
		<button class="btn btn-primary" onclick={handleNext} disabled={!isLLMConfigured}>
			Next
			<Icon name="chevron-right" size={16} />
		</button>
	</div>
</div>

<style>
	/* Scrollable variant of the shared ob-step layout */
	.services-step {
		max-height: 70vh;
		overflow-y: auto;
	}

	.security-note {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.7rem 1rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-lg);
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.security-note :global(svg) {
		color: var(--text-tertiary);
		flex-shrink: 0;
	}

	.service-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.1rem;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
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
		letter-spacing: 0.02em;
		text-transform: uppercase;
		color: var(--accent);
		background: var(--accent-subtle);
		padding: 0.2rem 0.55rem;
		border-radius: var(--radius-full);
		margin-left: auto;
	}

	.optional-badge {
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		color: var(--text-tertiary);
		background: var(--bg-tertiary);
		padding: 0.2rem 0.55rem;
		border-radius: var(--radius-full);
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
		background: var(--bg-tertiary);
		border-radius: var(--radius-full);
		transition: background 0.2s;
	}

	.toggle-btn.enabled .toggle-track {
		background: var(--accent);
	}

	.toggle-thumb {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 18px;
		height: 18px;
		background: var(--bg-primary);
		border-radius: 50%;
		transition: transform 0.2s;
		box-shadow: var(--shadow-xs);
	}

	.toggle-btn.enabled .toggle-thumb {
		background: #fff;
		transform: translateX(18px);
	}

	.api-key-input {
		width: 100%;
		padding: 0.85rem 1rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-lg);
		font-size: 0.9rem;
		font-family: var(--font-mono);
		color: var(--text-primary);
		transition: box-shadow 0.15s, background 0.15s;
	}

	.api-key-input::placeholder {
		color: var(--text-tertiary);
	}

	.api-key-input:focus {
		outline: none;
		background: var(--bg-primary);
		box-shadow: 0 0 0 3px var(--accent-muted);
	}

	.api-key-input.error {
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-error), transparent 78%);
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

	.provider-note.error {
		color: var(--color-error);
	}

	.skip-note {
		margin: 0;
		font-size: 0.8rem;
		color: var(--text-tertiary);
	}

</style>
