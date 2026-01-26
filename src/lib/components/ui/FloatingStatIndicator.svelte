<script lang="ts">
	import Icon from './Icon.svelte';

	interface Props {
		stat: string;
		delta: number;
		color: string;
		icon: string;
		onComplete?: () => void;
	}

	let { stat, delta, color, icon, onComplete }: Props = $props();

	// Trigger completion callback after animation
	$effect(() => {
		const timer = setTimeout(() => {
			onComplete?.();
		}, 2000);

		return () => clearTimeout(timer);
	});
</script>

<div class="indicator" style="--stat-color: {color}">
	<Icon name={icon} size={14} />
	<span class="delta">{delta > 0 ? '+' : ''}{delta}</span>
</div>

<style>
	.indicator {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.625rem;
		background: var(--glass-bg-solid);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-radius: 1rem;
		border: 1px solid var(--glass-border);
		color: var(--stat-color);
		font-weight: 600;
		font-size: 0.875rem;
		white-space: nowrap;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
		animation: float-fade 2s ease-out forwards;
	}

	.delta {
		font-variant-numeric: tabular-nums;
	}

	@keyframes float-fade {
		0% {
			opacity: 0;
			transform: translateY(10px) scale(0.8);
		}
		10% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
		70% {
			opacity: 1;
			transform: translateY(-40px) scale(1);
		}
		100% {
			opacity: 0;
			transform: translateY(-60px) scale(0.9);
		}
	}

	:global(.dark) .indicator {
		box-shadow: 0 2px 16px rgba(0, 0, 0, 0.3);
	}
</style>
