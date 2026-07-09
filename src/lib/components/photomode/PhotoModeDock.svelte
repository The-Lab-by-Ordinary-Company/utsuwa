<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import {
		photomodeStore,
		PHOTO_FILTERS,
		type PhotoBackground,
		type PhotoFilterId,
		type PhotoFrameId
	} from '$lib/stores/photomode.svelte';
	import { displayStore, CAMERA_LIMITS } from '$lib/stores/display.svelte';
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import { loadPoseManifest, type PoseEntry } from '$lib/services/poses';
	import { keepImage } from '$lib/services/storage/keepsakes';
	import { isTauri } from '$lib/services/platform';

	type Tab = 'pose' | 'face' | 'scene' | 'camera' | 'sticker';
	const TABS: Array<{ id: Tab; label: string }> = [
		{ id: 'camera', label: 'Camera' },
		{ id: 'pose', label: 'Pose' },
		{ id: 'face', label: 'Face' },
		{ id: 'scene', label: 'Scene' },
		{ id: 'sticker', label: 'Sticker' }
	];

	let tab = $state<Tab>('camera');
	let collapsed = $state(false);
	let poses = $state<PoseEntry[]>([]);
	let capturing = $state(false);
	let flash = $state(false);
	let savedTick = $state(false);
	let timerOn = $state(false);
	let countdown = $state(0);

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
			swatch: 'repeating-conic-gradient(#d9d9d9 0% 25%, #ffffff 0% 50%) 0 0 / 10px 10px'
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

	const FILTER_IDS = Object.keys(PHOTO_FILTERS) as PhotoFilterId[];

	const STICKERS: Array<{ id: string; label: string; src: string }> = [
		{ id: 'utsuwa-logo', label: 'Utsuwa logo', src: '/brand-assets/logo.svg' }
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
			if (timerOn) {
				for (countdown = 3; countdown > 0; countdown--) {
					await new Promise((r) => setTimeout(r, 1000));
				}
			}
			const blob = await photomodeStore.capture(scale);
			if (!blob) return;

			flash = true;
			setTimeout(() => (flash = false), 220);

			await keepImage(crypto.randomUUID(), blob, {
				mimeType: 'image/png',
				note: 'Photo mode'
			});

			// Browser download on web; the desktop build keeps the photoboard copy
			// (native save dialog is a follow-up needing the Tauri dialog plugin)
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
			countdown = 0;
			capturing = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if flash}
	<div class="shutter-flash" aria-hidden="true"></div>
{/if}

{#if countdown > 0}
	<div class="countdown" aria-hidden="true">{countdown}</div>
{/if}

{#if collapsed}
	<button class="panel-pill" onclick={() => (collapsed = false)} aria-label="Open photo controls">
		<Icon name="camera" size={16} />
	</button>
{:else}
	<div class="photo-panel" role="toolbar" aria-label="Photo mode">
		<div class="panel-header">
			<span class="panel-title">Photo Mode</span>
			{#if savedTick}
				<span class="saved-tick">Saved</span>
			{/if}
			<button class="header-btn" onclick={() => (collapsed = true)} aria-label="Collapse panel">
				<Icon name="chevron-up" size={14} />
			</button>
			<button class="header-btn" onclick={() => photomodeStore.exit()} aria-label="Exit photo mode">
				<Icon name="x" size={14} />
			</button>
		</div>

		<div class="tab-strip" role="tablist">
			{#each TABS as t (t.id)}
				<button
					class="tab"
					class:active={tab === t.id}
					role="tab"
					aria-selected={tab === t.id}
					onclick={() => (tab = t.id)}
				>
					{t.label}
				</button>
			{/each}
		</div>

		<div class="tab-content">
			{#if tab === 'pose'}
				<div class="chip-wrap">
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
			{:else if tab === 'face'}
				<div class="chip-wrap">
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
			{:else if tab === 'scene'}
				<span class="mini-label">Background</span>
				<div class="chip-wrap">
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
				<span class="mini-label">Filter</span>
				<div class="chip-wrap">
					{#each FILTER_IDS as id (id)}
						<button
							class="chip"
							class:selected={photomodeStore.filterId === id}
							onclick={() => photomodeStore.setFilter(id)}
						>
							{PHOTO_FILTERS[id].label}
						</button>
					{/each}
				</div>
				<span class="mini-label">Frame</span>
				<div class="chip-wrap">
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
				<label class="toggle-row">
					<span>Vignette</span>
					<input
						class="switch-input"
						type="checkbox"
						checked={photomodeStore.vignette}
						onchange={(e) => photomodeStore.setVignette(e.currentTarget.checked)}
					/>
					<span class="switch" aria-hidden="true"><span class="switch-thumb"></span></span>
				</label>
			{:else if tab === 'camera'}
				<span class="mini-label">
					Lens
					<span class="mini-value">{displayStore.camera.fov.toFixed(0)} deg</span>
				</span>
				<input
					class="slider"
					type="range"
					min={CAMERA_LIMITS.fov.min}
					max={CAMERA_LIMITS.fov.max}
					step="1"
					value={displayStore.camera.fov}
					oninput={(e) => displayStore.setCamera({ fov: parseFloat(e.currentTarget.value) })}
					aria-label="Field of view"
				/>
				<label class="toggle-row">
					<span>Look at camera</span>
					<input
						class="switch-input"
						type="checkbox"
						checked={photomodeStore.headTracking}
						onchange={(e) => photomodeStore.setHeadTracking(e.currentTarget.checked)}
					/>
					<span class="switch" aria-hidden="true"><span class="switch-thumb"></span></span>
				</label>
				<label class="toggle-row">
					<span>Thirds grid</span>
					<input
						class="switch-input"
						type="checkbox"
						checked={photomodeStore.showGrid}
						onchange={(e) => photomodeStore.setGrid(e.currentTarget.checked)}
					/>
					<span class="switch" aria-hidden="true"><span class="switch-thumb"></span></span>
				</label>
				<button class="panel-btn" onclick={resetFraming}>Reset framing</button>
			{:else if tab === 'sticker'}
				<div class="chip-wrap">
					{#each STICKERS as sticker (sticker.id)}
						<button class="chip" onclick={() => photomodeStore.addSticker(sticker.src)}>
							{sticker.label}
						</button>
					{/each}
				</div>
				{#if photomodeStore.stickers.length > 0}
					<span class="mini-label">On the shot</span>
					{#each photomodeStore.stickers as active, i (active.id)}
						<div class="sticker-row">
							<img class="sticker-thumb" src={active.src} alt="" />
							<span class="sticker-name">Sticker {i + 1}</span>
							<button
								class="header-btn"
								aria-label="Remove sticker"
								onclick={() => photomodeStore.removeSticker(active.id)}
							>
								<Icon name="x" size={13} />
							</button>
						</div>
					{/each}
					<span class="hint">Drag to move. Scroll to resize. Double-click also removes.</span>
				{:else}
					<span class="hint">Add a sticker, then drag it anywhere on the shot.</span>
				{/if}
			{/if}
		</div>

		<div class="capture-row">
			<button
				class="panel-btn timer"
				class:selected={timerOn}
				onclick={() => (timerOn = !timerOn)}
				title="3 second self-timer"
			>
				3s
			</button>
			<button class="panel-btn" onclick={() => takePhoto(1)} disabled={capturing}>Snap</button>
			<button class="panel-btn primary" onclick={() => takePhoto(2)} disabled={capturing}>
				<Icon name="camera" size={14} />
				{capturing ? (countdown > 0 ? String(countdown) : '...') : 'Capture'}
			</button>
		</div>
	</div>
{/if}

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

	.countdown {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 55;
		font-size: 6rem;
		font-weight: 700;
		color: white;
		text-shadow: 0 2px 24px rgba(0, 0, 0, 0.45);
		pointer-events: none;
		animation: countPop 1s ease-out infinite;
	}

	@keyframes countPop {
		from {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
		to {
			opacity: 0.2;
			transform: translate(-50%, -50%) scale(1.25);
		}
	}

	.panel-pill {
		position: fixed;
		top: 1rem;
		left: 1rem;
		z-index: 45;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-full);
		background: color-mix(in srgb, var(--bg-primary), transparent 8%);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		color: var(--text-secondary);
		cursor: pointer;
		box-shadow: var(--shadow-md);
	}

	.panel-pill:hover {
		color: var(--text-primary);
	}

	.photo-panel {
		position: fixed;
		top: 1rem;
		left: 1rem;
		z-index: 45;
		width: 272px;
		max-height: calc(100vh - 2rem);
		padding: 0.75rem;
		background: color-mix(in srgb, var(--bg-primary), transparent 8%);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		animation: panelIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	@keyframes panelIn {
		from {
			opacity: 0;
			transform: translateY(-6px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.panel-header {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.panel-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-right: auto;
	}

	.saved-tick {
		font-size: 0.6875rem;
		color: var(--color-success);
	}

	.header-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: none;
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--text-tertiary);
		cursor: pointer;
		transition: color 0.15s ease, background 0.15s ease;
	}

	.header-btn:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.tab-strip {
		display: flex;
		gap: 0.125rem;
		padding: 0.125rem;
		background: var(--bg-tertiary);
		border-radius: var(--radius-md);
	}

	.tab {
		flex: 1;
		padding: 0.3rem 0;
		border: none;
		border-radius: calc(var(--radius-md) - 2px);
		background: transparent;
		color: var(--text-tertiary);
		font-size: 0.66rem;
		font-weight: 600;
		cursor: pointer;
		transition: color 0.15s ease, background 0.15s ease;
	}

	.tab:hover {
		color: var(--text-primary);
	}

	.tab.active {
		background: var(--bg-primary);
		color: var(--text-primary);
		box-shadow: var(--shadow-xs);
	}

	.tab-content {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		overflow-y: auto;
		min-height: 96px;
	}

	.mini-label {
		display: flex;
		justify-content: space-between;
		font-size: 0.66rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-tertiary);
	}

	.mini-value {
		font-variant-numeric: tabular-nums;
		text-transform: none;
	}

	.chip-wrap {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.chip {
		padding: 0.28rem 0.6rem;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-full);
		background: var(--bg-secondary);
		color: var(--text-secondary);
		font-size: 0.7rem;
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
		width: 26px;
		height: 26px;
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

	.slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 4px;
		border-radius: 2px;
		background: var(--bg-tertiary);
		outline: none;
		cursor: pointer;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 15px;
		height: 15px;
		border-radius: 50%;
		background: var(--accent);
		border: none;
		cursor: pointer;
	}

	.slider::-moz-range-thumb {
		width: 15px;
		height: 15px;
		border-radius: 50%;
		background: var(--accent);
		border: none;
		cursor: pointer;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.75rem;
		color: var(--text-secondary);
		cursor: pointer;
	}

	/* Pill switch in the same style as the settings service toggles */
	.switch-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
		pointer-events: none;
	}

	.switch {
		position: relative;
		width: 34px;
		height: 20px;
		border-radius: var(--radius-full);
		background: var(--bg-tertiary);
		border: 1px solid var(--border-subtle);
		transition: background 0.18s ease, border-color 0.18s ease;
		flex-shrink: 0;
	}

	.switch-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 14px;
		height: 14px;
		border-radius: var(--radius-full);
		background: var(--text-tertiary);
		box-shadow: var(--shadow-xs);
		transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background 0.18s ease;
	}

	.switch-input:checked + .switch {
		background: var(--accent);
		border-color: var(--accent);
	}

	.switch-input:checked + .switch .switch-thumb {
		background: white;
		transform: translateX(14px);
	}

	.switch-input:focus-visible + .switch {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.hint {
		font-size: 0.66rem;
		color: var(--text-tertiary);
		line-height: 1.4;
	}

	.sticker-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.375rem;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		background: var(--bg-secondary);
	}

	.sticker-thumb {
		width: 34px;
		height: 18px;
		object-fit: contain;
	}

	.sticker-name {
		flex: 1;
		font-size: 0.7rem;
		color: var(--text-secondary);
	}

	.capture-row {
		display: flex;
		gap: 0.375rem;
	}

	.panel-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		padding: 0.45rem 0.5rem;
		border: none;
		border-radius: var(--radius-md);
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		font-size: 0.72rem;
		font-weight: 500;
		cursor: pointer;
		transition: color 0.15s ease, background 0.15s ease;
	}

	.panel-btn:hover:not(:disabled) {
		color: var(--text-primary);
	}

	.panel-btn.timer {
		flex: 0 0 40px;
	}

	.panel-btn.selected {
		background: var(--accent);
		color: white;
	}

	.panel-btn.primary {
		background: var(--accent);
		color: white;
		flex: 1.4;
	}

	.panel-btn.primary:hover:not(:disabled) {
		filter: brightness(1.06);
	}

	.panel-btn:disabled {
		opacity: 0.55;
		cursor: default;
	}
</style>
