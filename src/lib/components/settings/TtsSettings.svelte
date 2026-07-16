<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { getTTSProvider } from '$lib/services/providers/registry';
	import { Icon, ProviderDropdown, ModelDropdown } from '$lib/components/ui';
	import type { TtsSettingsState } from '$lib/stores/ai-services-settings.svelte';

	let { state }: { state: TtsSettingsState } = $props();
</script>

<div class="service-group">
	<div class="service-header">
		<Icon name="mic" size={14} />
		<span>Speech (TTS)</span>
		<button
			class="service-toggle"
			class:enabled={state.isTTSEnabled}
			onclick={state.toggleTTS}
			aria-label="Toggle speech (TTS)"
		>
			<span class="toggle-track">
				<span class="toggle-thumb"></span>
			</span>
		</button>
	</div>

	{#if state.isTTSEnabled}
		<ProviderDropdown
			type="tts"
			value={state.speechSettings.activeProvider as string}
			onSelect={state.handleTTSProviderChange}
			placeholder="Select TTS provider..."
		/>

		{#if state.speechSettings.activeProvider}
			{@const provider = getTTSProvider(state.speechSettings.activeProvider as string)}
			{#if provider?.requiresApiKey}
				<div class="api-key-row">
					<input
						type="password"
						class="api-key-input"
						class:error={state.ttsFetchError}
						placeholder="API Key"
						value={settingsStore.getProviderConfig(provider.id).apiKey ?? ''}
						oninput={(e) => state.handleApiKeyChange(provider.id, e.currentTarget.value)}
						onblur={state.handleTTSApiKeyBlur}
					/>
				</div>
			{/if}
		{/if}

		{#if state.speechSettings.activeProvider}
			{@const provider = getTTSProvider(state.speechSettings.activeProvider as string)}
			{#if !provider?.isLocal}
				<ModelDropdown
					models={state.ttsModels}
					value={state.speechSettings.activeModel as string}
					onSelect={state.handleTTSModelChange}
					placeholder="Select model..."
					isLoading={state.ttsIsLoading}
					onRefresh={state.ttsHasApiKey ? state.fetchTTSModels : undefined}
					disabled={!state.ttsHasApiKey}
					disabledMessage="Enter API key first"
				/>
			{/if}
		{/if}

		{#if state.speechSettings.activeProvider === 'elevenlabs'}
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

		{#if state.speechSettings.activeProvider}
			{@const provider = getTTSProvider(state.speechSettings.activeProvider as string)}
			{#if provider?.isLocal}
				<div class="api-key-row">
					<input
						type="text"
						class="api-key-input"
						list="local-tts-voices"
						placeholder="Voice (e.g. af_bella)"
						value={state.speechSettings.activeVoiceId as string ?? ''}
						onchange={(e) => state.handleTTSVoiceChange(e.currentTarget.value)}
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
						value={state.speechSettings.activeModel as string ?? ''}
						onchange={(e) => state.handleTTSModelChange(e.currentTarget.value)}
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

<style>
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
</style>
