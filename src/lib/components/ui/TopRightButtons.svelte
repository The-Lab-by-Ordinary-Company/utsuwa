<script lang="ts">
	import { goto } from '$app/navigation';
	import { Icon } from '$lib/components/ui';
	import CameraSettingsPanel from '$lib/components/ui/CameraSettingsPanel.svelte';
	import { localPath } from '$lib/config/links';
	import { isTauri } from '$lib/services/platform';
	import { getColorMode, cycleColorMode, type ColorMode } from '$lib/utils/color-mode';
	import { onMount } from 'svelte';

	interface Props {
		onInfoClick: () => void;
	}

	let { onInfoClick }: Props = $props();
	let showOverlayBtn = $state(false);
	let clusterOpen = $state(false);
	let showCamera = $state(false);
	let colorMode = $state<ColorMode>('system');
	let rootEl = $state<HTMLDivElement | null>(null);

	const themeIcon = $derived(
		colorMode === 'system' ? 'monitor' : colorMode === 'light' ? 'sun' : 'moon'
	);
	const themeLabel = $derived(
		colorMode === 'system' ? 'Theme: System' : colorMode === 'light' ? 'Theme: Light' : 'Theme: Dark'
	);

	onMount(() => {
		showOverlayBtn = isTauri();
		colorMode = getColorMode();

		// Close the cluster when clicking anywhere outside it
		const onPointerDown = (e: PointerEvent) => {
			if (clusterOpen && rootEl && !rootEl.contains(e.target as Node)) {
				clusterOpen = false;
				showCamera = false;
			}
		};
		document.addEventListener('pointerdown', onPointerDown);
		return () => document.removeEventListener('pointerdown', onPointerDown);
	});

	function toggleCluster() {
		clusterOpen = !clusterOpen;
		if (!clusterOpen) showCamera = false;
	}

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

<div class="top-right-buttons" bind:this={rootEl}>
	<div class="button-row">
		{#if showOverlayBtn}
			<button class="icon-btn overlay-btn" onclick={launchOverlay} aria-label="Launch overlay" title="Launch Overlay Mode">
				<Icon name="monitor" size={20} />
			</button>
		{/if}
		<button class="icon-btn" onclick={onInfoClick} aria-label="App info">
			<Icon name="info" size={20} />
		</button>
		<button
			class="icon-btn cluster-trigger"
			class:open={clusterOpen}
			onclick={toggleCluster}
			aria-label="Controls"
			aria-expanded={clusterOpen}
			title="Controls"
		>
			<Icon name={clusterOpen ? 'x' : 'sliders'} size={20} />
		</button>
	</div>

	{#if clusterOpen}
		<div class="cluster">
			<button
				class="icon-btn cluster-item"
				style="--i: 0"
				onclick={() => goto(localPath('app', '/settings'))}
				aria-label="Settings"
				title="Settings"
			>
				<Icon name="settings" size={20} />
			</button>
			<button
				class="icon-btn cluster-item"
				class:active={showCamera}
				style="--i: 1"
				onclick={() => (showCamera = !showCamera)}
				aria-label="Camera settings"
				title="Camera"
			>
				<Icon name="video" size={20} />
			</button>
			<button
				class="icon-btn cluster-item"
				style="--i: 2"
				onclick={() => (colorMode = cycleColorMode())}
				aria-label={themeLabel}
				title={themeLabel}
			>
				<Icon name={themeIcon} size={20} />
			</button>
		</div>

		{#if showCamera}
			<div class="camera-anchor">
				<CameraSettingsPanel onclose={() => (showCamera = false)} />
			</div>
		{/if}
	{/if}
</div>

<style>
	.top-right-buttons {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 40;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.button-row {
		display: flex;
		gap: 0.5rem;
	}

	/* Expanded column hangs below the trigger */
	.cluster {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.cluster-item {
		animation: clusterIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
		animation-delay: calc(var(--i) * 45ms);
	}

	@keyframes clusterIn {
		from {
			opacity: 0;
			transform: translateY(-8px) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.camera-anchor {
		position: absolute;
		top: 3.25rem;
		right: 3.25rem;
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

	.cluster-trigger.open,
	.cluster-item.active {
		color: var(--accent);
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
