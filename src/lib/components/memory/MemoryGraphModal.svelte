<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import MemoryGraph from './MemoryGraph.svelte';
	import { fadeFast } from '$lib/utils/motion';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="modal-overlay" out:fadeFast={{ duration: 160 }} role="dialog" aria-modal="true" aria-label="Memory Graph">
	<div class="modal-container">
		<header class="modal-header">
			<div class="header-info">
				<Icon name="brain" size={20} />
				<h2>Memory Graph</h2>
			</div>
			<button class="close-btn" onclick={onClose} aria-label="Close">
				<Icon name="x" size={20} />
			</button>
		</header>

		<div class="modal-content">
			<MemoryGraph />
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: var(--bg-primary);
		z-index: 1000;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--border-subtle);
		background: var(--bg-primary);
		flex-shrink: 0;
	}

	.header-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: var(--text-secondary);
	}

	.header-info h2 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.close-btn:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.modal-content {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}
</style>
