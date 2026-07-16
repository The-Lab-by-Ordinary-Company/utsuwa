<script lang="ts">
	import { createTtsSettingsState } from '$lib/stores/ai-services-settings.svelte';
	import TtsSettings from '$lib/components/settings/TtsSettings.svelte';

	const state = createTtsSettingsState();
</script>

<div class="page">
	<header class="page-header">
		<h2>Text-to-Speech</h2>
		<p>Configure the voice provider and speech settings.</p>
	</header>

	<section class="section">
		<TtsSettings {state} />
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
