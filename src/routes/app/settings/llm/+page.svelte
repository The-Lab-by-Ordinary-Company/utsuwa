<script lang="ts">
	import { getLLMProvider } from '$lib/services/providers/registry';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import { createLlmSettingsState } from '$lib/stores/ai-services-settings.svelte';
	import LlmSettings from '$lib/components/settings/LlmSettings.svelte';

	const state = createLlmSettingsState();

	// Fetch local LLM models automatically when the endpoint changes.
	$effect(() => {
		const providerId = state.consciousnessSettings.activeProvider as string;
		const provider = providerId ? getLLMProvider(providerId) : null;
		if (!provider?.isLocal) {
			state.lastLocalLLMFetchKey = '';
			return;
		}

		const baseUrl = settingsStore.getProviderConfig(provider.id).baseUrl ?? provider.defaultBaseUrl ?? '';
		const fetchKey = `${provider.id}:${baseUrl}`;

		if (fetchKey !== state.lastLocalLLMFetchKey) {
			state.lastLocalLLMFetchKey = fetchKey;
			state.debouncedFetchLLMModels();
		}
	});
</script>

<div class="page">
	<header class="page-header">
		<h2>LLM Model</h2>
		<p>Configure the chat model and provider settings.</p>
	</header>

	<section class="section">
		<LlmSettings {state} />
	</section>
</div>

<style>
	.page {
		height: 100%;
		overflow-y: auto;
	}

	.page-header {
		margin-bottom: 1.5rem;
	}

	.page-header h2 {
		margin: 0 0 0.25rem;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.page-header p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-tertiary);
	}

	.section {
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		padding: 1rem;
		box-shadow: var(--shadow-sm);
	}
</style>
