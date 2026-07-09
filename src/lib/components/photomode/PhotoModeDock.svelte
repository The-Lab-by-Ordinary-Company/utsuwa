<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import { photomodeStore, type PhotoBackground, type PhotoFrameId } from '$lib/stores/photomode.svelte';
	import { displayStore, CAMERA_LIMITS } from '$lib/stores/display.svelte';
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import { loadPoseManifest, type PoseEntry } from '$lib/services/poses';
	import { keepImage } from '$lib/services/storage/keepsakes';
	import { isTauri } from '$lib/services/platform';

	let poses = $state<PoseEntry[]>([]);
	let capturing = $state(false);
	let flash = $state(false);
	let savedTick = $state(false);

	// Visemes, blinks, and gaze presets are animation channels, not moods
	const HIDDEN_EXPRESSIONS = new Set([
		'aa', 'ih', 'ou', 'ee', 'oh',
		'blink', 'blinkLeft', 'blinkRight',
		'lookUp', 'lookDown', 'lookLeft', 'lookRight',
		'neutral'
	]);
	const expressions = $derived(
		(vrmStore.availableExpressions ?? []).filter((name) => !HIDDEN_EXPRESSIONS.has(name))
	);

	const BACKGROUNDS: Array<{ id: string; label: string; bg: PhotoBackground; swatch: string }> = [
		{ id: 'room', label: 'Room', bg: { type: 'room' }, swatch: 'var(--bg-tertiary)' },
		{
			id: 'transparent',
			label: 'Clear',
			bg: { type: 'transparent' },
			swatch:
				'repeating-conic-gradient(#d9d9d9 0% 25%, #ffffff 0% 50%) 0 0 / 10px 10px'
		},
		{ id: 'white', label: 'White', bg: { type: 'solid', value: '#ffffff' }, swatch: '#ffffff' },
		{ id: 'black', label: 'Black', bg: { type: 'solid', value: '#0b0b0d' }, swatch: '#0b0b0d' },
		{
			id: 'mist',
			label: 'Mist',
			bg: { type: 'gradient', value: '#dfe9f3,#ffffff' },
			swatch: 'linear-gradient(180deg, #dfe9f3, #ffffff)'
		},
		{
			id: 'blossom',
			label: 'Blossom',
			bg: { type: 'gradient', value: '#fbd3e0,#fde8d7' },
			swatch: 'linear-gradient(180deg, #fbd3e0, #fde8d7)'
		},
		{
			id: 'lagoon',
			label: 'Lagoon',
			bg: { type: 'gradient', value: '#c2e9fb,#e0f7e9' },
			swatch: 'linear-gradient(180deg, #c2e9fb, #e0f7e9)'
		}
	];

	const FRAMES: Array<{ id: PhotoFrameId; label: string }> = [
		{ id: 'none', label: 'None' },
		{ id: 'polaroid', label: 'Polaroid' },
		{ id: 'film', label: 'Film' }
	];

	const activeBackgroundId = $derived(
		BACKGROUNDS.find(
			(b) =>
				b.bg.type === photomodeStore.background.type &&
				b.bg.value === photomodeStore.background.value
		)?.id ?? 'custom'
	);

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

	async function takePhoto(scale: number) {
		if (capturing) return;
		capturing = true;
		try {
			const blob = await photomodeStore.capture(scale);
			if (!blob) return;

			flash = true;
			setTimeout(() => (flash = false), 220);

			// Photoboard pickup via the existing keepsake store
			await keepImage(crypto.randomUUID(), blob, {
				mimeType: 'image/png',
				note: 'Photo mode'
			});

			// File export: browser download on web. The desktop build keeps the
			// photoboard copy; a native save dialog needs the dialog plugin and is
			// tracked as a follow-up.
			if (!isTauri()) {
				const url = URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.download = `utsuwa-photo-${Date.now()}.png`;
				link.href = url;
				link.click();
				URL.revokeObjectURL(url);
			}

			savedTick = true;
			setTimeout(() => (savedTick = false), 1600);
		} catch (e) {
			console.error('[PhotoMode] Capture failed:', e);
		} finally {
			capturing = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if flash}
	<div class="shutter-flash" aria-hidden="true"></div>
{/if}

<div class="photo-dock" role="toolbar" aria-label="Photo mode">
	<div class="dock-header">
		<span class="dock-title">Photo Mode</span>
		{#if savedTick}
			<span class="saved-tick">Saved to photoboard</span>
		{/if}
		<button class="dock-close" onclick={() => photomodeStore.exit()} aria-label="Exit photo mode">
			<Icon name="x" size={16} />
		</button>
	</div>

	<div class="dock-row">
		<span class="row-label">Pose</span>
		<div class="chip-carousel">
			<button
				class="chip"
				class:selected={photomodeStore.selectedPoseId === null}
				onclick={() => photomodeStore.setPose(null)}
			>
				Natural
			</button>
			{#each poses as pose (pose.id)}
				<button
					class="chip"
					class:selected={photomodeStore.selectedPoseId === pose.id}
					onclick={() => photomodeStore.setPose(pose.id)}
				>
					{pose.name}
				</button>
			{/each}
		</div>
	</div>

	{#if expressions.length > 0}
		<div class="dock-row">
			<span class="row-label">Expression</span>
			<div class="chip-carousel">
				<button
					class="chip"
					class:selected={photomodeStore.selectedExpression === null}
					onclick={() => photomodeStore.setExpression(null)}
				>
					Mood
				</button>
				{#each expressions as name (name)}
					<button
						class="chip chip-cap"
						class:selected={photomodeStore.selectedExpression === name}
						onclick={() => photomodeStore.setExpression(name)}
					>
						{name}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<div class="dock-row">
		<span class="row-label">Background</span>
		<div class="chip-carousel">
			{#each BACKGROUNDS as bg (bg.id)}
				<button
					class="swatch"
					class:selected={activeBackgroundId === bg.id}
					style:background={bg.swatch}
					title={bg.label}
					aria-label={`Background: ${bg.label}`}
					onclick={() => photomodeStore.setBackground(bg.bg)}
				></button>
			{/each}
		</div>
	</div>

	<div class="dock-row split">
		<div class="split-col">
			<span class="row-label">Frame</span>
			<div class="chip-carousel">
				{#each FRAMES as frame (frame.id)}
					<button
						class="chip"
						class:selected={photomodeStore.frameId === frame.id}
						onclick={() => photomodeStore.setFrame(frame.id)}
					>
						{frame.label}
					</button>
				{/each}
			</div>
		</div>
		<div class="split-col">
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
	</div>

	<div class="dock-actions">
		<button class="dock-btn" onclick={resetFraming}>Reset framing</button>
		<button class="dock-btn" onclick={() => takePhoto(1)} disabled={capturing}>Quick snap</button>
		<button class="dock-btn primary" onclick={() => takePhoto(2)} disabled={capturing}>
			<Icon name="camera" size={14} />
			{capturing ? 'Capturing' : 'Capture'}
		</button>
	</div>
</div>

<style>
	.shutter-flash {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: white;
		pointer-events: none;
		animation: flashOut 0.22s ease-out both;
	}

	@keyframes flashOut {
		from {
			opacity: 0.9;
		}
		to {
			opacity: 0;
		}
	}

	.photo-dock {
		position: fixed;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 45;
		width: min(640px, calc(100vw - 2rem));
		padding: 0.875rem 1rem;
		background: color-mix(in srgb, var(--bg-primary), transparent 8%);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
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
		gap: 0.5rem;
	}

	.dock-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-right: auto;
	}

	.saved-tick {
		font-size: 0.6875rem;
		color: var(--color-success);
		animation: dockIn 0.2s ease both;
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
		gap: 0.3rem;
	}

	.dock-row.split {
		flex-direction: row;
		gap: 1rem;
	}

	.split-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-width: 0;
	}

	.row-label {
		display: flex;
		justify-content: space-between;
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.row-value {
		color: var(--text-tertiary);
		font-variant-numeric: tabular-nums;
	}

	.chip-carousel {
		display: flex;
		gap: 0.375rem;
		overflow-x: auto;
		padding-bottom: 0.125rem;
		scrollbar-width: thin;
	}

	.chip {
		flex-shrink: 0;
		padding: 0.3rem 0.7rem;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-full);
		background: var(--bg-secondary);
		color: var(--text-secondary);
		font-size: 0.72rem;
		font-weight: 500;
		cursor: pointer;
		transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
	}

	.chip-cap {
		text-transform: capitalize;
	}

	.chip:hover {
		color: var(--text-primary);
	}

	.chip.selected {
		background: var(--accent);
		border-color: var(--accent);
		color: white;
	}

	.swatch {
		flex-shrink: 0;
		width: 30px;
		height: 30px;
		border-radius: var(--radius-full);
		border: 2px solid var(--border-subtle);
		cursor: pointer;
		transition: transform 0.15s ease, border-color 0.15s ease;
	}

	.swatch:hover {
		transform: scale(1.08);
	}

	.swatch.selected {
		border-color: var(--accent);
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
		margin-top: 0.55rem;
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
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
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

	.dock-btn:hover:not(:disabled) {
		color: var(--text-primary);
	}

	.dock-btn.primary {
		background: var(--accent);
		color: white;
	}

	.dock-btn.primary:hover:not(:disabled) {
		color: white;
		filter: brightness(1.06);
	}

	.dock-btn:disabled {
		opacity: 0.55;
		cursor: default;
	}
</style>
