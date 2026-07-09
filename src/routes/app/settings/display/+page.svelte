<script lang="ts">
	import { displayStore, type ChatDisplayMode, type SidebarPosition } from '$lib/stores/display.svelte';
	import { Icon } from '$lib/components/ui';

	const modes: { value: ChatDisplayMode; label: string; icon: string; description: string }[] = [
		{ value: 'bubble', label: 'Bubble', icon: 'message', description: 'Speech bubble above the avatar' },
		{ value: 'sidebar', label: 'Sidebar', icon: 'list', description: 'Chat history in a side panel' },
		{ value: 'both', label: 'Both', icon: 'monitor', description: 'Bubble plus sidebar' },
		{ value: 'off', label: 'Off', icon: 'x', description: 'No on-screen chat text' }
	];

	const positions: { value: SidebarPosition; label: string; icon: string }[] = [
		{ value: 'left', label: 'Left', icon: 'chevron-left' },
		{ value: 'right', label: 'Right', icon: 'chevron-right' }
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
			<Icon name="message" size={18} />
			<h3>Chat Display</h3>
		</div>
		<p class="card-description">Choose where the conversation is shown.</p>

		<div class="mode-grid">
			{#each modes as mode}
				<button
					class="mode-option"
					class:active={displayStore.chatDisplayMode === mode.value}
					onclick={() => displayStore.setChatDisplayMode(mode.value)}
					aria-pressed={displayStore.chatDisplayMode === mode.value}
				>
					<Icon name={mode.icon} size={20} />
					<span class="mode-label">{mode.label}</span>
					<span class="mode-description">{mode.description}</span>
				</button>
			{/each}
		</div>
	</section>

	{#if sidebarActive}
		<section class="card">
			<div class="card-header">
				<Icon name="chevron-right" size={18} />
				<h3>Sidebar Position</h3>
			</div>
			<p class="card-description">Dock the chat history panel to the left or right edge.</p>

			<div class="position-options">
				{#each positions as pos}
					<button
						class="position-option"
						class:active={displayStore.sidebarPosition === pos.value}
						onclick={() => displayStore.setSidebarPosition(pos.value)}
						aria-pressed={displayStore.sidebarPosition === pos.value}
					>
						<Icon name={pos.icon} size={16} />
						<span>{pos.label}</span>
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
		gap: 1.5rem;
		overflow-y: auto;
	}

	.page-header {
		flex-shrink: 0;
	}

	.page-header h2 {
		margin: 0 0 0.5rem;
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
		padding: 1.25rem;
		box-shadow: var(--shadow-sm);
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		margin-bottom: 0.375rem;
	}

	.card-header h3 {
		margin: 0;
		font-size: 1.0625rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.card-description {
		margin: 0 0 1rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.mode-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.mode-option {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		padding: 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-light);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		cursor: pointer;
		transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
		text-align: center;
	}

	.mode-option:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.mode-option.active {
		background: var(--accent-muted);
		border-color: var(--accent);
		color: var(--accent);
	}

	.mode-label {
		font-size: 0.9375rem;
		font-weight: 600;
	}

	.mode-description {
		font-size: 0.75rem;
		font-weight: 400;
		opacity: 0.85;
	}

	.position-options {
		display: flex;
		gap: 0.75rem;
	}

	.position-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-light);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
	}

	.position-option:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.position-option.active {
		background: var(--accent-muted);
		border-color: var(--accent);
		color: var(--accent);
	}

	@media (max-width: 480px) {
		.mode-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
