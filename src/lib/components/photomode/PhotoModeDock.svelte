<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import { photomodeStore } from '$lib/stores/photomode.svelte';
	import { displayStore, CAMERA_LIMITS } from '$lib/stores/display.svelte';
	import { loadPoseManifest, type PoseEntry } from '$lib/services/poses';

	let poses = $state<PoseEntry[]>([]);

	$effect(() => {
		let cancelled = false;
		loadPoseManifest().then((entries) => {
			if (!cancelled) poses = entries;
		});
		return () => {
			cancelled = true;
		};
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') photomodeStore.exit();
	}

	function resetFraming() {
		displayStore.resetCamera();
		photomodeStore.requestReframe();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="photo-dock" role="toolbar" aria-label="Photo mode">
	<div class="dock-header">
		<span class="dock-title">Photo Mode</span>
		<button class="dock-close" onclick={() => photomodeStore.exit()} aria-label="Exit photo mode">
			<Icon name="x" size={16} />
		</button>
	</div>

	<div class="dock-row">
		<span class="row-label">Pose</span>
		<div class="pose-carousel">
			<button
				class="pose-chip"
				class:selected={photomodeStore.selectedPoseId === null}
				onclick={() => photomodeStore.setPose(null)}
			>
				Natural
			</button>
			{#each poses as pose (pose.id)}
				<button
					class="pose-chip"
					class:selected={photomodeStore.selectedPoseId === pose.id}
					onclick={() => photomodeStore.setPose(pose.id)}
				>
					{pose.name}
				</button>
			{/each}
		</div>
	</div>

	<div class="dock-row">
		<span class="row-label">
			Lens
			<span class="row-value">{displayStore.camera.fov.toFixed(0)} deg</span>
		</span>
		<input
			type="range"
			min={CAMERA_LIMITS.fov.min}
			max={CAMERA_LIMITS.fov.max}
			step="1"
			value={displayStore.camera.fov}
			oninput={(e) => displayStore.setCamera({ fov: parseFloat(e.currentTarget.value) })}
			aria-label="Field of view"
		/>
	</div>

	<div class="dock-actions">
		<button class="dock-btn" onclick={resetFraming}>Reset framing</button>
	</div>
</div>

<style>
	.photo-dock {
		position: fixed;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 45;
		width: min(560px, calc(100vw - 2rem));
		padding: 0.875rem 1rem;
		background: color-mix(in srgb, var(--bg-primary), transparent 8%);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		animation: dockIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	@keyframes dockIn {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.dock-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.dock-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.dock-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border: none;
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		transition: color 0.15s ease, background 0.15s ease;
	}

	.dock-close:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.dock-row {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.row-label {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.row-value {
		color: var(--text-tertiary);
		font-variant-numeric: tabular-nums;
	}

	.pose-carousel {
		display: flex;
		gap: 0.375rem;
		overflow-x: auto;
		padding-bottom: 0.25rem;
		scrollbar-width: thin;
	}

	.pose-chip {
		flex-shrink: 0;
		padding: 0.375rem 0.75rem;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-full);
		background: var(--bg-secondary);
		color: var(--text-secondary);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
	}

	.pose-chip:hover {
		color: var(--text-primary);
	}

	.pose-chip.selected {
		background: var(--accent);
		border-color: var(--accent);
		color: white;
	}

	.dock-row input[type='range'] {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 4px;
		border-radius: 2px;
		background: var(--bg-tertiary);
		outline: none;
		cursor: pointer;
	}

	.dock-row input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--accent);
		border: none;
		cursor: pointer;
	}

	.dock-row input[type='range']::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--accent);
		border: none;
		cursor: pointer;
	}

	.dock-actions {
		display: flex;
		gap: 0.5rem;
	}

	.dock-btn {
		flex: 1;
		padding: 0.5rem;
		border: none;
		border-radius: var(--radius-md);
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: color 0.15s ease, background 0.15s ease;
	}

	.dock-btn:hover {
		color: var(--text-primary);
	}
</style>
