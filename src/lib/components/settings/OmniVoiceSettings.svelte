<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import type { TtsSettingsState } from '$lib/stores/ai-services-settings.svelte';
	import type { ProviderMetadata } from '$lib/services/providers/registry';
import { checkTTSProviderHealth } from '$lib/services/providers/health-check';
	import './ai-services-settings.css';

	let {
		state,
		provider
	}: {
		state: TtsSettingsState;
		provider: ProviderMetadata;
	} = $props();

	const languages = [
		{ code: 'en', name: 'English' },
		{ code: 'de', name: 'German' },
		{ code: 'es', name: 'Spanish' },
		{ code: 'fr', name: 'French' },
		{ code: 'it', name: 'Italian' },
		{ code: 'pt', name: 'Portuguese' },
		{ code: 'ja', name: 'Japanese' },
		{ code: 'ko', name: 'Korean' },
		{ code: 'zh', name: 'Chinese' },
		{ code: 'ru', name: 'Russian' },
		{ code: 'nl', name: 'Dutch' },
		{ code: 'pl', name: 'Polish' }
	];

	function parseSpeed(value: string): number | undefined {
		const parsed = parseFloat(value);
		return Number.isNaN(parsed) ? undefined : parsed;
	}
</script>

<div class="omnivoice-section">
	<div class="omnivoice-section-title">OmniVoice Proxy</div>

	<div class="omnivoice-field">
		<label class="omnivoice-label" for="omnivoice-base-url">Base URL</label>
		<input
			id="omnivoice-base-url"
			type="text"
			class="api-key-input"
			placeholder={provider.defaultBaseUrl || 'http://localhost:8880/v1/'}
			value={settingsStore.getProviderConfig(provider.id).baseUrl ?? ''}
			onchange={(e) => {
					settingsStore.setProviderConfig(provider.id, { baseUrl: e.currentTarget.value });
					checkTTSProviderHealth(provider.id, e.currentTarget.value);
				}}
		/>
	</div>
</div>

<div class="omnivoice-section">
	<div class="omnivoice-section-title">Voice</div>

	<div class="omnivoice-field">
		<label class="omnivoice-label" for="omnivoice-language">Language</label>
		<select
			id="omnivoice-language"
			class="api-key-input"
			value={(state.speechSettings.activeLanguage as string) ?? 'en'}
			onchange={(e) => state.handleTTSLanguageChange(e.currentTarget.value)}
		>
			{#each languages as lang}
				<option value={lang.code}>{lang.name}</option>
			{/each}
		</select>
	</div>

	<div class="omnivoice-field">
		<label class="omnivoice-label" for="omnivoice-voice">Preset Voice</label>
		<select
			id="omnivoice-voice"
			class="api-key-input"
			value={(state.speechSettings.activeVoiceId as string) ?? ''}
			onchange={(e) => state.handleTTSVoiceChange(e.currentTarget.value)}
		>
			<option value="" disabled>Select a voice...</option>
			{#each provider.voices ?? [] as voice}
				<option value={voice.id}>{voice.name}</option>
			{/each}
		</select>
	</div>

	<div class="omnivoice-field">
		<label class="omnivoice-label" for="omnivoice-speed">
			Speed <span class="omnivoice-value">{(state.speechSettings.speed as number) ?? 1}</span>
		</label>
		<input
			id="omnivoice-speed"
			type="range"
			min="0.5"
			max="2.0"
			step="0.1"
			class="omnivoice-slider"
			value={(state.speechSettings.speed as number) ?? 1}
			oninput={(e) => state.handleTTSSpeedChange(parseSpeed(e.currentTarget.value))}
		/>
	</div>
</div>

<style>
	.omnivoice-section {
		background: var(--bg-primary);
		border: 1px solid var(--border-subtle, color-mix(in srgb, var(--text-secondary) 12%, transparent));
		border-radius: var(--radius-lg);
		padding: 0.75rem;
		margin-top: 0.5rem;
	}

	.omnivoice-section-title {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-tertiary);
		margin-bottom: 0.6rem;
	}

	.omnivoice-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-bottom: 0.6rem;
	}

	.omnivoice-field:last-child {
		margin-bottom: 0;
	}

	.omnivoice-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.omnivoice-value {
		font-family: var(--font-mono);
		color: var(--text-tertiary);
	}

	.omnivoice-slider {
		width: 100%;
		height: 4px;
		accent-color: var(--accent);
		cursor: pointer;
		background: transparent;
	}
</style>
