<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { Icon } from '$lib/components/ui';
</script>

<div class="service-group">
	<div class="service-header">
		<Icon name="mic" size={14} />
		<span>Voice Input (STT)</span>
	</div>
	<p class="stt-hint">Higher quality voice input via Whisper. A local server is used if configured, then Groq, then OpenAI, then the browser's built-in recognition. Required on desktop (which has no built-in recognition).</p>

	<span class="stt-sublabel">Groq API Key</span>
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

	<span class="stt-sublabel">OpenAI API Key (Whisper)</span>
	<div class="api-key-row">
		<input
			type="password"
			class="api-key-input"
			placeholder="OpenAI API Key"
			value={settingsStore.getProviderConfig('openai-stt').apiKey ?? ''}
			oninput={(e) => {
				settingsStore.setProviderConfig('openai-stt', { apiKey: e.currentTarget.value });
				settingsStore.markProviderAdded('openai-stt');
			}}
		/>
	</div>

	<span class="stt-sublabel">Local server (Speaches, faster-whisper-server, whisper.cpp)</span>
	<div class="api-key-row">
		<input
			type="text"
			class="api-key-input"
			placeholder="http://localhost:8000/v1/"
			value={settingsStore.getProviderConfig('local-stt').baseUrl ?? ''}
			oninput={(e) => {
				const v = e.currentTarget.value.trim();
				settingsStore.setProviderConfig('local-stt', { baseUrl: v });
				if (v) settingsStore.markProviderAdded('local-stt');
				else settingsStore.removeProvider('local-stt');
			}}
		/>
	</div>
	<div class="api-key-row">
		<input
			type="text"
			class="api-key-input"
			placeholder="Model (e.g. Systran/faster-whisper-large-v3)"
			value={settingsStore.getProviderConfig('local-stt').modelId ?? ''}
			oninput={(e) => {
				settingsStore.setProviderConfig('local-stt', { modelId: e.currentTarget.value.trim() });
			}}
		/>
	</div>
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

	.stt-hint {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		margin: 0;
		line-height: 1.4;
	}

	.stt-sublabel {
		display: block;
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-top: 0.25rem;
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
</style>
