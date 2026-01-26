<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import { screenshotStore } from '$lib/stores/screenshot.svelte';

	function takeScreenshot() {
		screenshotStore.take();
	}
</script>

<div class="top-left-buttons">
	<button class="icon-btn" onclick={takeScreenshot} aria-label="Take screenshot">
		<Icon name="camera" size={20} />
	</button>
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
		background: var(--glass-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid var(--glass-border);
		border-radius: 0.75rem;
		color: var(--color-neutral-600);
		cursor: pointer;
		transition: all 0.15s;
	}

	.icon-btn:hover {
		background: var(--glass-bg-solid);
		border-color: var(--color-ring);
		color: var(--color-neutral-800);
	}

	.icon-btn:active {
		transform: scale(0.95);
	}
</style>
