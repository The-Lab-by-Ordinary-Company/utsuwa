<script lang="ts">
	import { Icon } from '$lib/components/ui';

	interface Props {
		characterName: string;
		onComplete: () => void;
	}

	let { characterName, onComplete }: Props = $props();
</script>

<div class="step-content">
	<div class="success-icon">
		<Icon name="check" size={36} strokeWidth={3} />
	</div>

	<h2 class="title">You're All Set!</h2>
	<p class="subtitle">{characterName} is ready to chat with you</p>

	<div class="summary">
		<div class="summary-item">
			<Icon name="check-circle" size={14} />
			<span>Character configured</span>
		</div>
		<div class="summary-item">
			<Icon name="check-circle" size={14} />
			<span>Avatar selected</span>
		</div>
		<div class="summary-item">
			<Icon name="check-circle" size={14} />
			<span>AI services ready</span>
		</div>
		<div class="summary-item">
			<Icon name="check-circle" size={14} />
			<span>Mode selected</span>
		</div>
	</div>

	<button class="start-btn" onclick={onComplete}>
		Start Chatting
		<Icon name="arrow-right" size={18} />
	</button>
</div>

<style>
	.step-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 1.5rem;
		gap: 0.75rem;
	}

	.success-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 64px;
		background: color-mix(in srgb, var(--ctp-green) 15%, transparent);
		border-radius: 50%;
		color: var(--ctp-green);
		animation: scaleIn 0.3s ease-out;
	}

	@keyframes scaleIn {
		from {
			transform: scale(0.5);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.title {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--color-neutral-900);
		margin: 0;
	}

	.subtitle {
		font-size: 0.8rem;
		color: var(--color-neutral-600);
		margin: 0;
	}

	.summary {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.875rem 1.25rem;
		background: var(--color-neutral-100);
		border-radius: 0.625rem;
		margin: 0.375rem 0;
	}

	.summary-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		color: var(--ctp-green);
	}

	.start-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
		padding: 0.75rem 1.75rem;
		background: var(--accent);
		color: var(--accent-foreground);
		border: none;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.start-btn:hover {
		filter: brightness(1.1);
		transform: translateY(-1px);
	}
</style>
