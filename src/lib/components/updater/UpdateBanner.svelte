<script lang="ts">
	import { onMount } from 'svelte';
	import { Icon } from '$lib/components/ui';
	import { isTauri } from '$lib/services/platform/platform';
	import { updaterStore } from '$lib/stores/updater.svelte';

	// Quiet check on launch — only surfaces if an update is actually waiting.
	onMount(() => {
		if (isTauri()) updaterStore.check({ silent: true });
	});

	const status = $derived(updaterStore.status);

	const visible = $derived(
		isTauri() &&
			!updaterStore.dismissed &&
			(status === 'available' ||
				status === 'downloading' ||
				status === 'ready' ||
				(status === 'error' && !!updaterStore.availableVersion))
	);
</script>

{#if visible}
	<div class="update-banner" role="status" aria-live="polite">
		<div class="banner-icon">
			{#if status === 'error'}
				<Icon name="x" size={18} />
			{:else if status === 'ready'}
				<Icon name="check" size={18} />
			{:else}
				<Icon name="download" size={18} />
			{/if}
			<span class="icon-shine"></span>
		</div>

		<div class="banner-body">
			{#if status === 'available'}
				<span class="banner-title">Update available</span>
				<span class="banner-sub">Utsuwa {updaterStore.availableVersion} is ready to install</span>
			{:else if status === 'downloading'}
				<span class="banner-title">Downloading update…</span>
				<div class="progress-track">
					<div class="progress-fill" style="width: {updaterStore.progress}%"></div>
				</div>
			{:else if status === 'ready'}
				<span class="banner-title">Update installed</span>
				<span class="banner-sub">Restarting…</span>
			{:else if status === 'error'}
				<span class="banner-title">Update failed</span>
				<span class="banner-sub">{updaterStore.errorMessage ?? 'Please try again later.'}</span>
			{/if}
		</div>

		{#if status === 'available'}
			<div class="banner-actions">
				<button class="btn ghost" onclick={() => updaterStore.dismiss()}>Later</button>
				<button class="btn primary" onclick={() => updaterStore.install()}>
					<span>Install &amp; Restart</span>
					<span class="btn-shine"></span>
				</button>
			</div>
		{:else if status === 'error'}
			<div class="banner-actions">
				<button class="btn ghost" onclick={() => updaterStore.dismiss()}>Dismiss</button>
				<button class="btn primary" onclick={() => updaterStore.install()}>
					<span>Retry</span>
					<span class="btn-shine"></span>
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.update-banner {
		position: fixed;
		top: calc(1.25rem + env(safe-area-inset-top, 0));
		left: 50%;
		transform: translateX(-50%);
		z-index: 900;
		display: flex;
		align-items: center;
		gap: 0.875rem;
		max-width: min(540px, calc(100vw - 2rem));
		padding: 0.875rem 1rem;
		border-radius: 16px;
		background: linear-gradient(180deg, #ffffff 0%, #f4f6f8 100%);
		border: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow:
			0 12px 40px rgba(0, 0, 0, 0.18),
			0 4px 12px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.9);
		animation: bannerIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) backwards;
	}

	:global(.dark) .update-banner {
		background: linear-gradient(180deg, #232323 0%, #181818 100%);
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow:
			0 12px 40px rgba(0, 0, 0, 0.5),
			0 4px 12px rgba(0, 0, 0, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
	}

	@keyframes bannerIn {
		from {
			opacity: 0;
			transform: translate(-50%, -16px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0) scale(1);
		}
	}

	.banner-icon {
		position: relative;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border-radius: 11px;
		color: white;
		background: linear-gradient(180deg, #4dd0ff 0%, #01b2ff 50%, #0099dd 100%);
		box-shadow:
			0 4px 12px rgba(1, 178, 255, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.2);
		overflow: hidden;
	}

	.icon-shine {
		position: absolute;
		top: 2px;
		left: 15%;
		right: 15%;
		height: 45%;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.1) 60%, transparent 100%);
		border-radius: 0.5rem 0.5rem 50% 50%;
		pointer-events: none;
	}

	.banner-body {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
		flex: 1;
	}

	.banner-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.2;
	}

	.banner-sub {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		line-height: 1.3;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.progress-track {
		margin-top: 0.35rem;
		width: 200px;
		max-width: 100%;
		height: 6px;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.08);
		overflow: hidden;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.12);
	}

	:global(.dark) .progress-track {
		background: rgba(255, 255, 255, 0.08);
	}

	.progress-fill {
		height: 100%;
		border-radius: 999px;
		background: linear-gradient(90deg, #4dd0ff 0%, #01b2ff 100%);
		transition: width 0.2s ease-out;
	}

	.banner-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.btn {
		font-size: 0.8125rem;
		font-weight: 600;
		border-radius: 999px;
		padding: 0.5rem 0.9rem;
		cursor: pointer;
		transition: all 0.15s ease-out;
		white-space: nowrap;
	}

	.btn.ghost {
		background: transparent;
		border: 1px solid transparent;
		color: var(--text-tertiary);
	}

	.btn.ghost:hover {
		color: var(--text-primary);
		background: rgba(0, 0, 0, 0.04);
	}

	:global(.dark) .btn.ghost:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.btn.primary {
		position: relative;
		overflow: hidden;
		color: white;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: linear-gradient(180deg, #4dd0ff 0%, #01b2ff 50%, #0099dd 100%);
		box-shadow:
			0 3px 10px rgba(1, 178, 255, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.35);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
	}

	.btn.primary:hover {
		transform: translateY(-1px);
		box-shadow:
			0 5px 14px rgba(1, 178, 255, 0.5),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}

	.btn-shine {
		position: absolute;
		top: 1px;
		left: 15%;
		right: 15%;
		height: 45%;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 60%, transparent 100%);
		border-radius: 999px 999px 50% 50%;
		pointer-events: none;
	}

	@media (max-width: 520px) {
		.update-banner {
			flex-wrap: wrap;
			max-width: calc(100vw - 1.5rem);
		}

		.banner-actions {
			width: 100%;
			justify-content: flex-end;
		}
	}
</style>
