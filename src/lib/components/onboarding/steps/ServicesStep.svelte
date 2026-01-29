<script lang="ts">
	import { Icon, ProviderDropdown, ModelDropdown } from '$lib/components/ui';
	import { modulesStore } from '$lib/stores/modules.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { getLLMProvider, getTTSProvider } from '$lib/services/providers/registry';

	interface Props {
		onNext: () => void;
		onBack: () => void;
	}

	let { onNext, onBack }: Props = $props();

	// LLM State
	const llmSettings = $derived(modulesStore.getModuleSettings('consciousness'));
	const llmProvider = $derived(getLLMProvider(llmSettings.activeProvider as string));
	const llmModels = $derived(llmProvider?.models ?? []);

	// TTS State
	let ttsEnabled = $state(false);
	const ttsSettings = $derived(modulesStore.getModuleSettings('speech'));
	const ttsProvider = $derived(getTTSProvider(ttsSettings.activeProvider as string));
	const ttsModels = $derived(ttsProvider?.models ?? []);

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

	// Handlers
	function handleLLMProviderChange(providerId: string) {
		modulesStore.setModuleSetting('consciousness', 'activeProvider', providerId);
		const provider = getLLMProvider(providerId);
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

	function handleLLMBaseUrlChange(baseUrl: string) {
		if (llmProvider) {
			settingsStore.setProviderConfig(llmProvider.id, { baseUrl });
		}
	}

	function handleTTSProviderChange(providerId: string) {
		modulesStore.setModuleSetting('speech', 'activeProvider', providerId);
		const provider = getTTSProvider(providerId);
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

		{#if llmSettings.activeProvider && llmModels.length > 0 && !llmProvider?.isLocal}
			<ModelDropdown
				models={llmModels}
				value={llmSettings.activeModel as string}
				onSelect={handleLLMModelChange}
				placeholder="Select model..."
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

		{#if llmProvider?.requiresApiKey}
			<input
				type="password"
				class="api-key-input"
				placeholder="Enter API Key..."
				value={settingsStore.getProviderConfig(llmProvider.id).apiKey ?? ''}
				oninput={(e) => handleLLMApiKeyChange(e.currentTarget.value)}
			/>
		{/if}

		{#if llmProvider?.id === 'azure'}
			<input
				type="text"
				class="api-key-input"
				placeholder="Azure Resource Name (required)"
				value={settingsStore.getProviderConfig(llmProvider.id).resourceName ?? ''}
				oninput={(e) => settingsStore.setProviderConfig(llmProvider.id, { resourceName: e.currentTarget.value })}
			/>
			<input
				type="text"
				class="api-key-input"
				placeholder="Region (e.g., eastus)"
				value={settingsStore.getProviderConfig(llmProvider.id).region ?? ''}
				oninput={(e) => settingsStore.setProviderConfig(llmProvider.id, { region: e.currentTarget.value })}
			/>
		{/if}

		{#if llmProvider?.id === 'cloudflare'}
			<input
				type="text"
				class="api-key-input"
				placeholder="Cloudflare Account ID (required)"
				value={settingsStore.getProviderConfig(llmProvider.id).accountId ?? ''}
				oninput={(e) => settingsStore.setProviderConfig(llmProvider.id, { accountId: e.currentTarget.value })}
			/>
		{/if}

		{#if llmProvider?.id === 'openai-compatible'}
			<input
				type="text"
				class="api-key-input"
				placeholder="API Base URL (required)"
				value={settingsStore.getProviderConfig(llmProvider.id).baseUrl ?? ''}
				oninput={(e) => handleLLMBaseUrlChange(e.currentTarget.value)}
			/>
			<input
				type="text"
				class="api-key-input"
				placeholder="Model name"
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

			{#if ttsSettings.activeProvider && ttsModels.length > 0 && !ttsProvider?.isLocal}
				<ModelDropdown
					models={ttsModels}
					value={ttsSettings.activeModel as string}
					onSelect={handleTTSModelChange}
					placeholder="Select voice..."
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

			{#if ttsSettings.activeProvider === 'elevenlabs'}
				<input
					type="text"
					class="api-key-input"
					placeholder="Custom Voice ID (optional)"
					value={settingsStore.elevenLabsVoiceId}
					oninput={(e) => settingsStore.setElevenLabsVoiceId(e.currentTarget.value)}
				/>
			{/if}

			{#if ttsProvider?.id === 'openai-compatible-tts'}
				<input
					type="text"
					class="api-key-input"
					placeholder="API Base URL (required)"
					value={settingsStore.getProviderConfig(ttsProvider.id).baseUrl ?? ''}
					oninput={(e) => handleTTSBaseUrlChange(e.currentTarget.value)}
				/>
				<input
					type="text"
					class="api-key-input"
					placeholder="Voice name"
					value={ttsSettings.activeModel as string ?? ''}
					oninput={(e) => handleTTSModelChange(e.currentTarget.value)}
				/>
			{/if}

			{#if ttsProvider?.requiresApiKey}
				<input
					type="password"
					class="api-key-input"
					placeholder="Enter API Key..."
					value={settingsStore.getProviderConfig(ttsProvider.id).apiKey ?? ''}
					oninput={(e) => handleTTSApiKeyChange(e.currentTarget.value)}
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
