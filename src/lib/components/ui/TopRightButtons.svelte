<script lang="ts">
	import { goto } from '$app/navigation';
	import { Icon } from '$lib/components/ui';
	import { localPath } from '$lib/config/links';
	import { isTauri } from '$lib/services/platform';
	import { onMount } from 'svelte';

	interface Props {
		onInfoClick: () => void;
	}

	let { onInfoClick }: Props = $props();
	let showOverlayBtn = $state(false);

	onMount(() => {
		showOverlayBtn = isTauri();
	});

	async function launchOverlay() {
		try {
			const { invoke } = await import('@tauri-apps/api/core');
			const { getCurrentWindow } = await import('@tauri-apps/api/window');

			// Show overlay and hide main window
			await invoke('show_overlay');
			const mainWindow = getCurrentWindow();
			await mainWindow.hide();
		} catch (e) {
			console.error('Failed to launch overlay:', e);
		}
	}
</script>

<div class="top-right-buttons">
	{#if showOverlayBtn}
		<button class="icon-btn overlay-btn" onclick={launchOverlay} aria-label="Launch overlay" title="Launch Overlay Mode">
			<Icon name="monitor" size={20} />
		</button>
	{/if}
	<button class="icon-btn" onclick={onInfoClick} aria-label="App info">
		<Icon name="info" size={20} />
	</button>
	<button class="icon-btn" onclick={() => goto(localPath('app', '/settings'))} aria-label="Settings">
		<Icon name="settings" size={20} />
	</button>
</div>

<style>
	.top-right-buttons {
		position: fixed;
		top: 1rem;
		right: 1rem;
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
		background: var(--bg-tertiary);
		border: none;
		border-radius: var(--radius-full);
		color: var(--text-secondary);
		cursor: pointer;
		transition: color 0.15s ease, background 0.15s ease,
			box-shadow 0.15s ease, transform 0.15s ease;
		box-shadow: var(--shadow-sm);
	}

	.icon-btn:hover {
		color: var(--text-primary);
		background: color-mix(in srgb, var(--bg-tertiary), var(--text-primary) 8%);
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
	}

	.icon-btn:focus-visible {
		outline: none;
		color: var(--text-primary);
		box-shadow: 0 0 0 3px var(--accent-muted);
	}

	.icon-btn:active {
		color: var(--accent);
		transform: translateY(0) scale(0.96);
		box-shadow: var(--shadow-sm);
	}

	/* Overlay button - accent action */
	.overlay-btn {
		background: var(--accent);
		border-color: transparent;
		color: #fff;
	}

	.overlay-btn:hover {
		background: var(--accent-hover);
		color: #fff;
	}

	.overlay-btn:active {
		color: #fff;
	}
</style>
