<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import { onMount } from 'svelte';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	const version = `v${import.meta.env.VITE_APP_VERSION}`;

	// System info
	let sttSupport = $state('Checking...');
	let webglSupport = $state('Checking...');
	let storageStatus = $state('Checking...');

	onMount(() => {
		const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		sttSupport = SpeechRecognition ? 'Supported' : 'Unsupported';

		try {
			const canvas = document.createElement('canvas');
			const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
			webglSupport = gl ? 'Supported' : 'Unsupported';
		} catch {
			webglSupport = 'Unsupported';
		}

		storageStatus = 'indexedDB' in window ? 'Available' : 'Unavailable';
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="modal-overlay" onclick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="modal-title">
	<div class="modal-container">
		<!-- Close button row -->
		<div class="close-row">
			<button class="close-btn" onclick={onClose} aria-label="Close">
				<Icon name="x" size={14} />
			</button>
		</div>

		<!-- Logo & Version centered -->
		<div class="app-header">
			<div class="logo-badge">
				<div class="logo-badge-inner">
					<img src="/brand-assets/logo.svg" alt="Utsuwa - Open Source AI Soul Vessel" class="app-logo-svg" />
				</div>
				<div class="logo-badge-shine"></div>
			</div>
			<span class="version-badge">
				{version}
				<span class="version-shine"></span>
			</span>
		</div>

		<!-- Links -->
		<div class="link-tiles">
			<a href="https://github.com/The-Lab-by-Ordinary-Company/utsuwa" target="_blank" rel="noopener" class="link-tile" style="--delay: 0; --tile-color: #333; --tile-glow: rgba(0, 0, 0, 0.2)">
				<div class="tile-icon-wrapper">
					<span class="tile-icon">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
						</svg>
					</span>
					<span class="tile-icon-shine"></span>
				</div>
				<span class="tile-label">GitHub</span>
				<span class="tile-shine"></span>
			</a>
			<a href="/docs" class="link-tile" style="--delay: 1; --tile-color: #01B2FF; --tile-glow: rgba(1, 178, 255, 0.3)">
				<div class="tile-icon-wrapper">
					<span class="tile-icon">
						<Icon name="file-text" size={20} />
					</span>
					<span class="tile-icon-shine"></span>
				</div>
				<span class="tile-label">Docs</span>
				<span class="tile-shine"></span>
			</a>
		</div>

		<!-- System Info -->
		<div class="section-label">System</div>
		<div class="system-tiles">
			<div class="system-tile" style="--delay: 2">
				<span class="system-icon">
					<Icon name="mic" size={18} />
				</span>
				<span class="system-label">STT</span>
				<span class="system-status" class:success={sttSupport === 'Supported'} class:error={sttSupport === 'Unsupported'}>
					{#if sttSupport === 'Supported'}
						<Icon name="check" size={12} />
					{:else if sttSupport === 'Unsupported'}
						<Icon name="x" size={12} />
					{:else}
						...
					{/if}
					<span class="status-shine"></span>
				</span>
				<span class="tile-shine"></span>
			</div>
			<div class="system-tile" style="--delay: 3">
				<span class="system-icon">
					<Icon name="monitor" size={18} />
				</span>
				<span class="system-label">WebGL</span>
				<span class="system-status" class:success={webglSupport === 'Supported'} class:error={webglSupport === 'Unsupported'}>
					{#if webglSupport === 'Supported'}
						<Icon name="check" size={12} />
					{:else if webglSupport === 'Unsupported'}
						<Icon name="x" size={12} />
					{:else}
						...
					{/if}
					<span class="status-shine"></span>
				</span>
				<span class="tile-shine"></span>
			</div>
			<div class="system-tile" style="--delay: 4">
				<span class="system-icon">
					<Icon name="database" size={18} />
				</span>
				<span class="system-label">Storage</span>
				<span class="system-status" class:success={storageStatus === 'Available'} class:error={storageStatus === 'Unavailable'}>
					{#if storageStatus === 'Available'}
						<Icon name="check" size={12} />
					{:else if storageStatus === 'Unsupported'}
						<Icon name="x" size={12} />
					{:else}
						...
					{/if}
					<span class="status-shine"></span>
				</span>
				<span class="tile-shine"></span>
			</div>
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.modal-container {
		position: relative;
		background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
		border: 1px solid rgba(255, 255, 255, 0.8);
		border-radius: 20px;
		max-width: 300px;
		width: 90%;
		padding: 1.25rem;
		animation: slideUp 0.25s ease-out;
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.2),
			0 8px 24px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .modal-container {
		background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.5),
			0 8px 24px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	@keyframes slideUp {
		from {
			transform: translateY(16px) scale(0.98);
			opacity: 0;
		}
		to {
			transform: translateY(0) scale(1);
			opacity: 1;
		}
	}

	/* Close button row */
	.close-row {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 0.25rem;
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 50%;
		color: var(--text-tertiary);
		cursor: pointer;
		transition: all 0.15s;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	:global(.dark) .close-btn {
		background: linear-gradient(180deg, #333333 0%, #262626 100%);
		border-color: rgba(255, 255, 255, 0.1);
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.close-btn:hover {
		background: linear-gradient(180deg, #e8e8e8 0%, #d8d8d8 100%);
		color: var(--text-primary);
		transform: scale(1.05);
	}

	:global(.dark) .close-btn:hover {
		background: linear-gradient(180deg, #404040 0%, #333333 100%);
	}

	/* App header - centered logo & version */
	.app-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.logo-badge {
		position: relative;
	}

	.logo-badge-inner {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem 1.5rem;
		background: linear-gradient(180deg, #66d9ff 0%, #01B2FF 40%, #0088cc 100%);
		border-radius: 1rem;
		box-shadow:
			0 6px 24px rgba(1, 178, 255, 0.45),
			0 3px 8px rgba(0, 0, 0, 0.12),
			inset 0 2px 0 rgba(255, 255, 255, 0.4),
			inset 0 -2px 4px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.logo-badge-shine {
		position: absolute;
		top: 3px;
		left: 12%;
		right: 12%;
		height: 45%;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.1) 60%, transparent 100%);
		border-radius: 0.75rem 0.75rem 50% 50%;
		pointer-events: none;
	}

	.app-logo-svg {
		height: 24px;
		width: auto;
		filter: brightness(10);
	}

	:global(.dark) .app-logo-svg {
		filter: brightness(10);
	}

	.version-badge {
		position: relative;
		display: inline-block;
		padding: 0.3rem 0.75rem;
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 50%, #0099dd 100%);
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 600;
		color: white;
		box-shadow:
			0 3px 10px rgba(1, 178, 255, 0.4),
			0 1px 3px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
		overflow: hidden;
	}

	.version-shine {
		position: absolute;
		top: 2px;
		left: 15%;
		right: 15%;
		height: 50%;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 60%, transparent 100%);
		border-radius: 999px 999px 50% 50%;
		pointer-events: none;
	}

	/* Link Tiles */
	.link-tiles {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10px;
		margin-bottom: 1rem;
	}

	.link-tile {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 1rem 0.5rem;
		background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
		border: 1px solid rgba(0, 0, 0, 0.06);
		border-radius: 16px;
		text-decoration: none;
		color: var(--text-secondary);
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.1),
			0 2px 4px rgba(0, 0, 0, 0.06),
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			inset 0 -1px 2px rgba(0, 0, 0, 0.03);
		animation: bounceIn 0.35s ease-out backwards;
		animation-delay: calc(var(--delay, 0) * 50ms);
		overflow: hidden;
	}

	:global(.dark) .link-tile {
		background: linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 100%);
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.3),
			0 2px 4px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.06),
			inset 0 -1px 2px rgba(0, 0, 0, 0.2);
	}

	.link-tile:hover {
		transform: translateY(-3px);
		border-color: rgba(1, 178, 255, 0.4);
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.15),
			0 4px 8px rgba(0, 0, 0, 0.1),
			0 0 20px var(--tile-glow, rgba(1, 178, 255, 0.2)),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
	}

	:global(.dark) .link-tile:hover {
		box-shadow:
			0 8px 24px rgba(0, 0, 0, 0.4),
			0 4px 8px rgba(0, 0, 0, 0.25),
			0 0 24px var(--tile-glow, rgba(1, 178, 255, 0.25)),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.tile-shine {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 50%;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
		pointer-events: none;
		border-radius: 16px 16px 0 0;
	}

	:global(.dark) .tile-shine {
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 50%, transparent 100%);
	}

	.tile-icon-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 50%, #0099dd 100%);
		border-radius: 12px;
		box-shadow:
			0 4px 12px rgba(1, 178, 255, 0.4),
			0 2px 4px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			inset 0 -1px 2px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.tile-icon-shine {
		position: absolute;
		top: 2px;
		left: 15%;
		right: 15%;
		height: 45%;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.1) 60%, transparent 100%);
		border-radius: 0.5rem 0.5rem 50% 50%;
		pointer-events: none;
	}

	.tile-icon {
		display: flex;
		color: white;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
	}

	.tile-label {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-primary);
	}

	/* Section Label */
	.section-label {
		font-size: 0.6rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-tertiary);
		margin-bottom: 0.5rem;
		text-align: center;
	}

	/* System Tiles */
	.system-tiles {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
	}

	.system-tile {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 0.875rem 0.25rem;
		background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%);
		border: 1px solid rgba(0, 0, 0, 0.06);
		border-radius: 14px;
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.1),
			0 2px 4px rgba(0, 0, 0, 0.06),
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			inset 0 -1px 2px rgba(0, 0, 0, 0.03);
		animation: bounceIn 0.35s ease-out backwards;
		animation-delay: calc(var(--delay, 0) * 50ms);
		overflow: hidden;
	}

	:global(.dark) .system-tile {
		background: linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 100%);
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.3),
			0 2px 4px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.06),
			inset 0 -1px 2px rgba(0, 0, 0, 0.2);
	}

	.system-icon {
		display: flex;
		color: var(--text-tertiary);
	}

	.system-label {
		font-size: 0.6rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--text-tertiary);
	}

	.system-status {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		font-size: 0.65rem;
		font-weight: 600;
		overflow: hidden;
	}

	.system-status.success {
		background: linear-gradient(180deg, #4ade80 0%, #22c55e 50%, #16a34a 100%);
		color: white;
		box-shadow:
			0 3px 8px rgba(34, 197, 94, 0.45),
			0 1px 3px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}

	.system-status.error {
		background: linear-gradient(180deg, #f87171 0%, #ef4444 50%, #dc2626 100%);
		color: white;
		box-shadow:
			0 3px 8px rgba(239, 68, 68, 0.45),
			0 1px 3px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}

	.status-shine {
		position: absolute;
		top: 1px;
		left: 15%;
		right: 15%;
		height: 50%;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.1) 60%, transparent 100%);
		border-radius: 50% 50% 40% 40%;
		pointer-events: none;
	}

	@keyframes bounceIn {
		0% {
			opacity: 0;
			transform: scale(0.8) translateY(10px);
		}
		60% {
			transform: scale(1.05) translateY(-2px);
		}
		100% {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}
</style>
