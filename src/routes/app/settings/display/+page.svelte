<script lang="ts">
	import { browser } from '$app/environment';
	import { Icon } from '$lib/components/ui';
	import { displayStore } from '$lib/stores/display.svelte';

	type ColorMode = 'system' | 'light' | 'dark';
	let colorMode = $state<ColorMode>('system');

	// Load saved mode on init
	$effect(() => {
		if (browser) {
			const saved = localStorage.getItem('colorMode') as ColorMode | null;
			if (saved && ['system', 'light', 'dark'].includes(saved)) {
				colorMode = saved;
			}
			applyColorMode(colorMode);
		}
	});

	function setColorMode(mode: ColorMode) {
		colorMode = mode;
		if (browser) {
			localStorage.setItem('colorMode', mode);
			applyColorMode(mode);
		}
	}

	function applyColorMode(mode: ColorMode) {
		if (!browser) return;

		let shouldBeDark: boolean;
		if (mode === 'system') {
			shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		} else {
			shouldBeDark = mode === 'dark';
		}

		const root = document.documentElement;
		root.classList.toggle('dark', shouldBeDark);
		// Sync data-docs-theme for docs/blog pages
		if (mode === 'system') {
			root.removeAttribute('data-docs-theme');
		} else {
			root.setAttribute('data-docs-theme', mode);
		}
	}

	// System theme change listener lives in +layout.svelte (always mounted)
</script>

<div class="page">
	<header class="page-header">
		<h2>Display</h2>
		<p>Appearance and display settings.</p>
	</header>

	<div class="sections">
		<!-- Color Mode Selector -->
		<section class="section">
			<h3>Mode</h3>
			<div class="setting-row">
				<div class="setting-info">
					<span class="setting-label">Appearance</span>
					<span class="setting-desc">Choose light, dark, or match your system</span>
				</div>
				<div class="mode-selector">
					<button
						class="mode-option"
						class:active={colorMode === 'system'}
						onclick={() => setColorMode('system')}
					>
						<Icon name="monitor" size={16} />
						<span>System</span>
					</button>
					<button
						class="mode-option"
						class:active={colorMode === 'light'}
						onclick={() => setColorMode('light')}
					>
						<Icon name="sun" size={16} />
						<span>Light</span>
					</button>
					<button
						class="mode-option"
						class:active={colorMode === 'dark'}
						onclick={() => setColorMode('dark')}
					>
						<Icon name="moon" size={16} />
						<span>Dark</span>
					</button>
				</div>
			</div>
		</section>

		<!-- Camera Settings -->
		<section class="section">
			<h3>Camera</h3>
			<div class="setting-row">
				<div class="setting-info">
					<span class="setting-label">Starting Zoom</span>
					<span class="setting-desc">Adjust the default camera distance from the model</span>
				</div>
				<div class="slider-container">
					<span class="slider-label">Close</span>
					<input
						type="range"
						min="1"
						max="4"
						step="0.1"
						value={displayStore.cameraDistance}
						oninput={(e) => displayStore.setCameraDistance(parseFloat(e.currentTarget.value))}
						class="zoom-slider"
					/>
					<span class="slider-label">Far</span>
				</div>
			</div>
		</section>
	</div>
</div>

<style>
	.page {
		height: 100%;
		max-width: 640px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.page-header {
		margin-bottom: 1.5rem;
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
		color: var(--text-tertiary);
		font-size: 0.875rem;
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		flex: 1;
		overflow-y: auto;
		min-height: 0;
		padding-bottom: 1rem;
	}

	.section h3 {
		margin: 0 0 1rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 14px;
		box-shadow:
			0 3px 10px rgba(0, 0, 0, 0.06),
			0 1px 3px rgba(0, 0, 0, 0.04),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .setting-row {
		background: linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 100%);
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow:
			0 3px 10px rgba(0, 0, 0, 0.25),
			0 1px 3px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.setting-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.setting-label {
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--text-primary);
	}

	.setting-desc {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	/* Mode Selector - Skeuomorphic */
	.mode-selector {
		display: flex;
		background: linear-gradient(180deg, #e8e8e8 0%, #d8d8d8 100%);
		border-radius: 12px;
		padding: 4px;
		gap: 3px;
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.08),
			0 1px 0 rgba(255, 255, 255, 0.8);
	}

	:global(.dark) .mode-selector {
		background: linear-gradient(180deg, #1a1a1a 0%, #141414 100%);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.3),
			0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.mode-option {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		background: transparent;
		border: none;
		border-radius: 9px;
		color: var(--text-tertiary);
		font-size: 0.8125rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.15s ease-out;
	}

	.mode-option:hover:not(.active) {
		color: var(--text-secondary);
		background: rgba(255, 255, 255, 0.5);
	}

	:global(.dark) .mode-option:hover:not(.active) {
		background: rgba(255, 255, 255, 0.05);
	}

	.mode-option.active {
		background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
		color: var(--text-primary);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.12),
			0 1px 2px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .mode-option.active {
		background: linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.3),
			0 1px 2px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	/* Slider - Skeuomorphic */
	.slider-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.slider-label {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		white-space: nowrap;
	}

	.zoom-slider {
		width: 120px;
		height: 8px;
		appearance: none;
		background: linear-gradient(180deg, #d0d0d0 0%, #e0e0e0 100%);
		border-radius: 4px;
		cursor: pointer;
		box-shadow:
			inset 0 1px 3px rgba(0, 0, 0, 0.15),
			0 1px 0 rgba(255, 255, 255, 0.8);
	}

	:global(.dark) .zoom-slider {
		background: linear-gradient(180deg, #1a1a1a 0%, #252525 100%);
		box-shadow:
			inset 0 1px 3px rgba(0, 0, 0, 0.4),
			0 1px 0 rgba(255, 255, 255, 0.05);
	}

	.zoom-slider::-webkit-slider-thumb {
		appearance: none;
		width: 20px;
		height: 20px;
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 100%);
		border-radius: 50%;
		cursor: pointer;
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
		transition: transform 0.1s ease-out;
	}

	.zoom-slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
	}

	.zoom-slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 100%);
		border: none;
		border-radius: 50%;
		cursor: pointer;
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}

	/* Tablet and below */
	@media (max-width: 640px) {
		.page-header {
			margin-bottom: 1rem;
		}

		.page-header h2 {
			font-size: 1.25rem;
		}

		.sections {
			gap: 1.25rem;
		}

		.section h3 {
			margin-bottom: 0.75rem;
		}
	}

	/* Mobile */
	@media (max-width: 520px) {
		.setting-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}

		.mode-selector {
			align-self: stretch;
		}

		.mode-option {
			flex: 1;
			justify-content: center;
		}

		.slider-container {
			width: 100%;
		}

		.zoom-slider {
			flex: 1;
		}
	}

</style>
