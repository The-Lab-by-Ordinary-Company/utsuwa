<script lang="ts">
	interface Props {
		value: number;
		max?: number;
		variant?: 'default' | 'energy' | 'loneliness' | 'boredom' | 'health' | 'tier' | 'affection';
		size?: 'sm' | 'md' | 'lg';
		gradientColor?: string;
		class?: string;
	}

	let {
		value,
		max = 100,
		variant = 'default',
		size = 'md',
		gradientColor,
		class: className = ''
	}: Props = $props();

	const percentage = $derived(Math.min(100, Math.max(0, (value / max) * 100)));
</script>

<div
	class="progress-root size-{size} {className}"
	role="progressbar"
	aria-valuenow={value}
	aria-valuemin={0}
	aria-valuemax={max}
>
	<div
		class="progress-fill variant-{variant}"
		style="width: {percentage}%; {gradientColor ? `background: ${gradientColor}` : ''}"
	></div>
</div>

<style>
	.progress-root {
		position: relative;
		width: 100%;
		overflow: hidden;
		background: var(--bg-tertiary);
		border-radius: 9999px;
	}

	.progress-root.size-sm {
		height: 6px;
	}

	.progress-root.size-md {
		height: 8px;
	}

	.progress-root.size-lg {
		height: 12px;
	}

	.progress-fill {
		height: 100%;
		border-radius: 9999px;
		transition: width 0.3s ease-out;
	}

	.progress-fill.variant-default {
		background: var(--accent);
	}

	.progress-fill.variant-energy {
		background: var(--stat-energy);
	}

	.progress-fill.variant-loneliness {
		background: var(--stat-affection);
	}

	.progress-fill.variant-boredom {
		background: var(--color-warning);
	}

	.progress-fill.variant-health {
		/* Uses gradientColor prop for dynamic color */
	}

	.progress-fill.variant-tier {
		background: var(--stat-affection);
	}

	.progress-fill.variant-affection {
		background: var(--accent);
	}
</style>
