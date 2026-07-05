<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import type { PersonaPageState } from './persona-page.svelte';

	let { page }: { page: PersonaPageState } = $props();
</script>

<!-- App Mode Toggle -->
<div class="mode-section">
	<span class="section-label">App Mode</span>
	<div class="mode-toggle">
		<button
			class="mode-option"
			class:active={page.appMode === 'companion'}
			onclick={() => page.requestModeChange('companion')}
		>
			<Icon name="sparkles" size={14} />
			Companion
		</button>
		<button
			class="mode-option"
			class:active={page.appMode === 'dating_sim'}
			onclick={() => page.requestModeChange('dating_sim')}
		>
			<Icon name="heart" size={14} />
			Dating Sim
		</button>
	</div>
</div>

<style>
	/* Mode Section */
	.mode-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-light);
	}

	/* Duplicated in StatsPanel.svelte (label style shared by both panels) */
	.section-label {
		display: block;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-tertiary);
		margin-bottom: 0.75rem;
	}

	.mode-toggle {
		display: flex;
		gap: 0.5rem;
	}

	.mode-option {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.625rem 0.75rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
	}

	.mode-option:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.mode-option.active {
		background: var(--accent-muted);
		color: var(--accent);
	}
</style>
