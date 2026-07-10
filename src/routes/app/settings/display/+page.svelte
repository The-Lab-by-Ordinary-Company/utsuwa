<script lang="ts">
	import { displayStore, type ChatDisplayMode, type SidebarPosition } from '$lib/stores/display.svelte';

	const modes: { value: ChatDisplayMode; label: string }[] = [
		{ value: 'bubble', label: 'Bubble' },
		{ value: 'sidebar', label: 'Sidebar' },
		{ value: 'both', label: 'Both' },
		{ value: 'off', label: 'Off' }
	];

	const positions: { value: SidebarPosition; label: string }[] = [
		{ value: 'left', label: 'Left' },
		{ value: 'right', label: 'Right' }
	];

	const sidebarActive = $derived(
		displayStore.chatDisplayMode === 'sidebar' || displayStore.chatDisplayMode === 'both'
	);

	function stepDelay(delta: number) {
		const current = displayStore.typingIndicatorDelayMs / 1000;
		const next = Math.round((current + delta) * 10) / 10;
		displayStore.setTypingIndicatorDelayMs(Math.max(0, Math.min(10, next)) * 1000);
	}
</script>

<div class="display-page">
	<header class="page-header">
		<h2>Display</h2>
		<p>Configure how chat messages appear on screen.</p>
	</header>

	<section class="card">
		<div class="card-header">
			<h3>Chat Display</h3>
			<button class="reset-btn" onclick={() => displayStore.resetChatDisplay()}>
				Reset to defaults
			</button>
		</div>

		<div class="segment-control" role="group" aria-label="Chat display mode">
			{#each modes as mode}
				<button
					class="segment-btn"
					class:active={displayStore.chatDisplayMode === mode.value}
					onclick={() => displayStore.setChatDisplayMode(mode.value)}
					aria-pressed={displayStore.chatDisplayMode === mode.value}
				>
					{mode.label}
				</button>
			{/each}
		</div>
		<p class="hint">Bubble shows only the latest reply. Sidebar shows the full history.</p>
	</section>

	{#if sidebarActive}
		<section class="card">
			<div class="card-header">
				<h3>Sidebar Position</h3>
			</div>

			<div class="segment-control" role="group" aria-label="Sidebar position">
				{#each positions as pos}
					<button
						class="segment-btn"
						class:active={displayStore.sidebarPosition === pos.value}
						onclick={() => displayStore.setSidebarPosition(pos.value)}
						aria-pressed={displayStore.sidebarPosition === pos.value}
					>
						{pos.label}
					</button>
				{/each}
			</div>
		</section>
	{/if}

	<section class="card">
		<div class="card-header">
			<h3>Typing Indicator</h3>
		</div>

		<div class="settings-stack">
			<div class="setting-row">
				<div class="setting-info">
					<span class="setting-label">Wait tone</span>
					<span class="setting-desc">Soft audio ping while the typing indicator is visible</span>
				</div>
				<label class="toggle">
					<input
						type="checkbox"
						checked={displayStore.waitToneEnabled}
						onchange={(e) => displayStore.setWaitToneEnabled(e.currentTarget.checked)}
					/>
					<span class="toggle-track">
						<span class="toggle-thumb"></span>
					</span>
				</label>
			</div>

			<div class="setting-row" class:disabled={!displayStore.waitToneEnabled}>
				<div class="setting-info">
					<span class="setting-label">Delay</span>
					<span class="setting-desc">Wait before the typing dots appear</span>
				</div>
				<div class="delay-input-container">
					<button class="delay-step" onclick={() => stepDelay(-0.1)} disabled={displayStore.typingIndicatorDelayMs <= 0 || !displayStore.waitToneEnabled}>−</button>
					<input
						type="number"
						class="delay-input"
						min="0"
						max="10"
						step="0.1"
						value={(displayStore.typingIndicatorDelayMs / 1000).toFixed(1)}
						oninput={(e) => displayStore.setTypingIndicatorDelayMs(parseFloat(e.currentTarget.value) * 1000)}
						disabled={!displayStore.waitToneEnabled}
					/>
					<span class="delay-unit">s</span>
					<button class="delay-step" onclick={() => stepDelay(0.1)} disabled={displayStore.typingIndicatorDelayMs >= 10000 || !displayStore.waitToneEnabled}>+</button>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.display-page {
		height: 100%;
		max-width: 720px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		overflow-y: auto;
	}

	.page-header {
		flex-shrink: 0;
	}

	.page-header h2 {
		margin: 0 0 0.25rem;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.page-header p {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.9375rem;
	}

	.card {
		background: var(--bg-primary);
		border: 1px solid var(--border-light);
		border-radius: var(--radius-lg);
		padding: 1rem 1.25rem;
		box-shadow: var(--shadow-sm);
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		margin-bottom: 0.625rem;
	}

	.card-header h3 {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.settings-stack {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.segment-control {
		display: flex;
		width: 100%;
		background: var(--bg-secondary);
		border: 1px solid var(--border-light);
		border-radius: var(--radius-md);
		padding: 0.25rem;
		gap: 0.25rem;
	}

	.segment-btn {
		flex: 1;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: none;
		border-radius: calc(var(--radius-md) - 0.125rem);
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
		white-space: nowrap;
	}

	.segment-btn:hover {
		color: var(--text-primary);
	}

	.segment-btn.active {
		background: var(--accent-muted);
		color: var(--accent);
		font-weight: 600;
	}

	.reset-btn {
		padding: 0.375rem 0.75rem;
		background: transparent;
		border: 1px solid var(--border-light);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
	}

	.reset-btn:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border-color: var(--border-light);
	}

	.hint {
		margin: 0.625rem 0 0;
		color: var(--text-secondary);
		font-size: 0.8125rem;
	}

	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.setting-row.disabled {
		opacity: 0.45;
		filter: grayscale(0.7);
		pointer-events: none;
		transition: opacity 0.2s ease, filter 0.2s ease;
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
		color: var(--text-secondary);
	}

	.toggle {
		position: relative;
		display: inline-block;
		width: 40px;
		height: 22px;
		cursor: pointer;
		flex-shrink: 0;
	}

	.toggle input {
		opacity: 0;
		width: 0;
		height: 0;
		position: absolute;
	}

	.toggle-track {
		display: block;
		width: 100%;
		height: 100%;
		background: var(--bg-tertiary);
		border-radius: 11px;
		transition: background 0.2s ease-out;
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.15);
	}

	.toggle input:checked ~ .toggle-track {
		background: var(--accent);
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 18px;
		height: 18px;
		background: var(--bg-primary);
		border-radius: 50%;
		transition: transform 0.2s ease-out;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		pointer-events: none;
	}

	.toggle input:checked ~ .toggle-track .toggle-thumb {
		transform: translateX(18px);
	}

	.delay-input-container {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.delay-step {
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-light);
		background: var(--bg-secondary);
		color: var(--text-primary);
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.delay-step:hover:not(:disabled) {
		background: var(--bg-tertiary);
	}

	.delay-step:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.delay-input {
		width: 3.5rem;
		padding: 0.35rem 0.5rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-light);
		background: var(--bg-secondary);
		font-size: 0.875rem;
		color: var(--text-primary);
		text-align: center;
		appearance: textfield;
		-moz-appearance: textfield;
	}

	.delay-input::-webkit-outer-spin-button,
	.delay-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
	}

	.delay-unit {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}
</style>
