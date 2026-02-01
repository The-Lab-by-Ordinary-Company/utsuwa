<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import MemoryGraph from './MemoryGraph.svelte';

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

<div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Memory Graph">
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
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
		background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
		flex-shrink: 0;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .modal-header {
		background: linear-gradient(180deg, #252525 0%, #1a1a1a 100%);
		border-bottom-color: rgba(255, 255, 255, 0.08);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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
		background: linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 0.5rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	:global(.dark) .close-btn {
		background: linear-gradient(180deg, #333333 0%, #262626 100%);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.close-btn:hover {
		background: linear-gradient(180deg, #e8e8e8 0%, #d8d8d8 100%);
		color: var(--text-primary);
		transform: translateY(-1px);
		box-shadow:
			0 4px 8px rgba(0, 0, 0, 0.12),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .close-btn:hover {
		background: linear-gradient(180deg, #404040 0%, #333333 100%);
	}

	.modal-content {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}
</style>
