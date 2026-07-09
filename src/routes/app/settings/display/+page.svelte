<script lang="ts">
	import { displayStore, type ChatDisplayMode, type SidebarPosition } from '$lib/stores/display.svelte';

	const modes: { value: ChatDisplayMode; label: string }[] = [
		{ value: 'bubble', label: 'Bubble' },
		{ value: 'sidebar', label: 'Sidebar' },
		{ value: 'both', label: 'Both' },
		{ value: 'off', label: 'Off' }
	];

	const positions: { value: SidebarPosition; label: string }[] = [
		{ value: 'left', label: 'Left' },
		{ value: 'right', label: 'Right' }
	];

	const sidebarActive = $derived(
		displayStore.chatDisplayMode === 'sidebar' || displayStore.chatDisplayMode === 'both'
	);
</script>

<div class="display-page">
	<header class="page-header">
		<h2>Display</h2>
		<p>Configure how chat messages appear on screen.</p>
	</header>

	<section class="card">
		<div class="card-header">
			<h3>Chat Display</h3>
		</div>

		<div class="segment-control" role="group" aria-label="Chat display mode">
			{#each modes as mode}
				<button
					class="segment-btn"
					class:active={displayStore.chatDisplayMode === mode.value}
					onclick={() => displayStore.setChatDisplayMode(mode.value)}
					aria-pressed={displayStore.chatDisplayMode === mode.value}
				>
					{mode.label}
				</button>
			{/each}
		</div>
		<p class="hint">Bubble shows only the latest reply. Sidebar shows the full history.</p>
	</section>

	{#if sidebarActive}
		<section class="card">
			<div class="card-header">
				<h3>Sidebar Position</h3>
			</div>

			<div class="segment-control" role="group" aria-label="Sidebar position">
				{#each positions as pos}
					<button
						class="segment-btn"
						class:active={displayStore.sidebarPosition === pos.value}
						onclick={() => displayStore.setSidebarPosition(pos.value)}
						aria-pressed={displayStore.sidebarPosition === pos.value}
					>
						{pos.label}
					</button>
				{/each}
			</div>
		</section>
	{/if}
</div>

<style>
	.display-page {
		height: 100%;
		max-width: 720px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-y: auto;
	}

	.page-header {
		flex-shrink: 0;
	}

	.page-header h2 {
		margin: 0 0 0.25rem;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.page-header p {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.9375rem;
	}

	.card {
		background: var(--bg-primary);
		border: 1px solid var(--border-light);
		border-radius: var(--radius-lg);
		padding: 1rem 1.25rem;
		box-shadow: var(--shadow-sm);
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		margin-bottom: 0.625rem;
	}

	.card-header h3 {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.segment-control {
		display: flex;
		width: 100%;
		background: var(--bg-secondary);
		border: 1px solid var(--border-light);
		border-radius: var(--radius-md);
		padding: 0.25rem;
		gap: 0.25rem;
	}

	.segment-btn {
		flex: 1;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: none;
		border-radius: calc(var(--radius-md) - 0.125rem);
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
		white-space: nowrap;
	}

	.segment-btn:hover {
		color: var(--text-primary);
	}

	.segment-btn.active {
		background: var(--accent-muted);
		color: var(--accent);
		font-weight: 600;
	}

	.hint {
		margin: 0.625rem 0 0;
		color: var(--text-secondary);
		font-size: 0.8125rem;
	}
</style>
