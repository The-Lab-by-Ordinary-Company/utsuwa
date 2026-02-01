<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import { screenshotStore } from '$lib/stores/screenshot.svelte';

	interface Props {
		onOpenMemoryGraph?: () => void;
	}

	let { onOpenMemoryGraph }: Props = $props();

	function takeScreenshot() {
		screenshotStore.take();
	}
</script>

<div class="top-left-buttons">
	<button class="icon-btn" onclick={takeScreenshot} aria-label="Take screenshot">
		<Icon name="camera" size={20} />
	</button>
	{#if onOpenMemoryGraph}
		<button class="icon-btn" onclick={onOpenMemoryGraph} aria-label="Open memory graph">
			<Icon name="brain" size={20} />
		</button>
	{/if}
</div>

<style>
	.top-left-buttons {
		position: fixed;
		top: 1rem;
		left: 1rem;
		z-index: 40;
		display: flex;
		gap: 0.5rem;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: var(--bg-primary);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid var(--border-light);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s;
		box-shadow: var(--shadow-sm);
	}

	.icon-btn:hover {
		background: var(--bg-secondary);
		border-color: var(--text-tertiary);
		color: var(--text-primary);
	}

	.icon-btn:focus {
		outline: none;
		border-color: #01B2FF;
		box-shadow: 0 0 0 3px rgba(1, 178, 255, 0.15);
	}

	.icon-btn:active {
		transform: scale(0.95);
	}
</style>
