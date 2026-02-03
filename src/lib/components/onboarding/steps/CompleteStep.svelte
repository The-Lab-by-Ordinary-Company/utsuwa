<script lang="ts">
	import { Icon } from '$lib/components/ui';
	import { vrmStore } from '$lib/stores/vrm.svelte';

	interface Props {
		characterName: string;
		onComplete: () => void;
	}

	let { characterName, onComplete }: Props = $props();

	const activeModel = $derived(vrmStore.models.find((m) => m.id === vrmStore.activeModelId));
</script>

<div class="complete-wrapper">
	<div class="complete-layout">
		<div class="avatar-box">
			<div class="avatar-box-shine"></div>
			{#if activeModel?.previewUrl}
				<img src={activeModel.previewUrl} alt={activeModel.name} />
			{:else}
				<div class="avatar-fallback">
					<Icon name="user" size={48} />
				</div>
			{/if}
			<div class="avatar-glow"></div>
		</div>

		<div class="text-box">
			<p class="greeting">Hi, I'm <strong>{characterName}</strong>!</p>
			<p class="tagline">Your new AI companion</p>
			<button class="start-btn" onclick={onComplete}>
				<span>Start Chatting</span>
				<div class="btn-shine"></div>
			</button>
		</div>
	</div>
</div>

<style>
	.complete-wrapper {
		padding: 2rem 1.5rem;
		display: flex;
		justify-content: center;
	}

	.complete-layout {
		display: flex;
		gap: 1.25rem;
		align-items: center;
	}

	.avatar-box {
		position: relative;
		width: 100px;
		height: 100px;
		border-radius: var(--radius-lg);
		background: linear-gradient(180deg, #66d9ff 0%, #01B2FF 40%, #0099dd 100%);
		padding: 4px;
		box-shadow:
			0 8px 24px rgba(1, 178, 255, 0.4),
			0 4px 12px rgba(0, 0, 0, 0.15),
			inset 0 2px 0 rgba(255, 255, 255, 0.4),
			inset 0 -2px 4px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.avatar-box-shine {
		position: absolute;
		top: 3px;
		left: 10%;
		right: 10%;
		height: 35%;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 60%, transparent 100%);
		border-radius: 0.625rem 0.625rem 50% 50%;
		pointer-events: none;
		z-index: 2;
	}

	.avatar-glow {
		position: absolute;
		inset: -12px;
		background: radial-gradient(circle at center, rgba(1, 178, 255, 0.35) 0%, transparent 70%);
		border-radius: 1.5rem;
		z-index: -1;
		animation: pulse-avatar 3s ease-in-out infinite;
	}

	@keyframes pulse-avatar {
		0%, 100% {
			opacity: 0.6;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.05);
		}
	}

	:global(.dark) .avatar-box {
		box-shadow:
			0 8px 24px rgba(1, 178, 255, 0.35),
			0 4px 12px rgba(0, 0, 0, 0.3),
			inset 0 2px 0 rgba(255, 255, 255, 0.3),
			inset 0 -2px 4px rgba(0, 0, 0, 0.2);
	}

	.avatar-box img {
		width: 100%;
		height: 100%;
		border-radius: calc(var(--radius-lg) - 4px);
		object-fit: cover;
		background: var(--bg-secondary);
		display: block;
	}

	.avatar-fallback {
		width: 100%;
		height: 100%;
		border-radius: calc(var(--radius-lg) - 4px);
		background: linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-tertiary);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .avatar-fallback {
		background: linear-gradient(180deg, #2a2a2a 0%, #1f1f1f 100%);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.text-box {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.greeting {
		font-size: 1.125rem;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.4;
	}

	.greeting strong {
		font-weight: 600;
	}

	.tagline {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.start-btn {
		position: relative;
		margin-top: 0.75rem;
		padding: 0.875rem 2rem;
		background: linear-gradient(180deg, #4dd0ff 0%, #01B2FF 40%, #0099dd 100%);
		color: white;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: var(--radius-full);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow:
			0 6px 20px rgba(1, 178, 255, 0.45),
			0 3px 6px rgba(0, 0, 0, 0.12),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
		width: fit-content;
		overflow: hidden;
	}

	.btn-shine {
		position: absolute;
		top: 2px;
		left: 15%;
		right: 15%;
		height: 45%;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 60%, transparent 100%);
		border-radius: 999px 999px 50% 50%;
		pointer-events: none;
	}

	.start-btn:hover {
		background: linear-gradient(180deg, #66d9ff 0%, #1ebfff 40%, #00a6e6 100%);
		transform: translateY(-2px);
		box-shadow:
			0 6px 18px rgba(1, 178, 255, 0.45),
			0 3px 6px rgba(0, 0, 0, 0.12),
			inset 0 1px 0 rgba(255, 255, 255, 0.5);
	}

	.start-btn:active {
		transform: translateY(0);
		background: linear-gradient(180deg, #0099dd 0%, #0088cc 100%);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
	}
</style>
