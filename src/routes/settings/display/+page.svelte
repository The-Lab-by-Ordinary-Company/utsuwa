<script lang="ts">
	import { browser } from '$app/environment';
	import { Icon } from '$lib/components/ui';
	import { themeStore, THEMES } from '$lib/stores/theme.svelte';
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

		document.documentElement.classList.toggle('dark', shouldBeDark);
	}

	// Listen for system theme changes when in system mode
	$effect(() => {
		if (!browser) return;

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handler = () => {
			if (colorMode === 'system') {
				applyColorMode('system');
			}
		};

		mediaQuery.addEventListener('change', handler);
		return () => mediaQuery.removeEventListener('change', handler);
	});

	function selectTheme(themeId: string) {
		themeStore.setTheme(themeId);
	}

	// Get preview colors for a theme based on current mode
	function getPreviewColors(theme: typeof THEMES[0]) {
		return [
			theme.colors.accent,
			theme.colors.green,
			theme.colors.blue,
			theme.colors.yellow,
			theme.colors.mauve
		];
	}
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

		<!-- Color Theme Selector -->
		<section class="section">
			<h3>Color Theme</h3>
			<div class="theme-grid">
				{#each THEMES as theme (theme.id)}
					<button
						class="theme-card"
						class:selected={themeStore.currentThemeId === theme.id}
						onclick={() => selectTheme(theme.id)}
					>
						<div class="theme-content">
							<div class="theme-info">
								<span class="theme-name">{theme.name}</span>
								<span class="theme-desc">{theme.description}</span>
							</div>
							<div class="theme-colors">
								{#each getPreviewColors(theme) as color}
									<span class="color-dot" style="background: {color}"></span>
								{/each}
							</div>
						</div>
						{#if themeStore.currentThemeId === theme.id}
							<div class="selected-badge">
								<Icon name="check" size={14} strokeWidth={3} />
							</div>
						{/if}
					</button>
				{/each}
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
		color: var(--color-neutral-900);
	}

	.page-header p {
		margin: 0;
		color: var(--color-neutral-500);
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
		color: var(--color-neutral-500);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: var(--color-neutral-100);
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
	}

	.setting-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.setting-label {
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--color-neutral-800);
	}

	.setting-desc {
		font-size: 0.75rem;
		color: var(--color-neutral-500);
	}

	/* Mode Selector */
	.mode-selector {
		display: flex;
		background: var(--color-neutral-200);
		border-radius: 0.5rem;
		padding: 3px;
		gap: 2px;
	}

	.mode-option {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		color: var(--color-neutral-500);
		font-size: 0.8125rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.15s;
	}

	.mode-option:hover:not(.active) {
		color: var(--color-neutral-700);
	}

	.mode-option.active {
		background: var(--color-neutral-50);
		color: var(--color-neutral-900);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .mode-option.active {
		background: var(--color-neutral-300);
	}

	/* Theme Grid */
	.theme-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.theme-card {
		position: relative;
		display: flex;
		align-items: center;
		padding: 1rem;
		background: var(--color-neutral-100);
		border: 2px solid var(--color-border);
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
		font-family: inherit;
	}

	.theme-card:hover {
		border-color: var(--color-neutral-300);
		background: var(--color-neutral-50);
	}

	.theme-card.selected {
		border-color: var(--accent);
		background: var(--accent-subtle);
	}

	.theme-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex: 1;
		gap: 1rem;
	}

	.theme-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.theme-name {
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--color-neutral-800);
	}

	.theme-desc {
		font-size: 0.75rem;
		color: var(--color-neutral-500);
	}

	.theme-colors {
		display: flex;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.color-dot {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
	}

	.selected-badge {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		background: var(--accent);
		color: var(--accent-foreground);
		border-radius: 50%;
	}

	/* Slider */
	.slider-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.slider-label {
		font-size: 0.75rem;
		color: var(--color-neutral-500);
		white-space: nowrap;
	}

	.zoom-slider {
		width: 120px;
		height: 6px;
		appearance: none;
		background: var(--color-neutral-200);
		border-radius: 3px;
		cursor: pointer;
	}

	.zoom-slider::-webkit-slider-thumb {
		appearance: none;
		width: 18px;
		height: 18px;
		background: var(--accent);
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.zoom-slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		background: var(--accent);
		border: none;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
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

	@media (max-width: 480px) {
		.theme-card {
			padding: 0.875rem;
		}

		.theme-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.625rem;
		}

		.theme-colors {
			align-self: flex-start;
		}

		.color-dot {
			width: 18px;
			height: 18px;
		}

		.theme-name {
			font-size: 0.875rem;
		}

		.selected-badge {
			top: 0.625rem;
			right: 0.625rem;
			width: 20px;
			height: 20px;
		}
	}
</style>
