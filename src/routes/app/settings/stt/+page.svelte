<script lang="ts">
	import SttSettings from '$lib/components/settings/SttSettings.svelte';
</script>

<div class="page">
	<header class="page-header">
		<h2>Voice Input</h2>
		<p>Configure speech-to-text providers and microphone sensitivity.</p>
	</header>

	<section class="section">
		<SttSettings />
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
