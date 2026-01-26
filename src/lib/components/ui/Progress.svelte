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
		background: var(--color-neutral-200);
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
		background: var(--color-primary-500);
	}

	.progress-fill.variant-energy {
		background: linear-gradient(to right, var(--ctp-yellow), var(--ctp-green));
	}

	.progress-fill.variant-loneliness {
		background: linear-gradient(to right, var(--ctp-green), var(--ctp-pink));
	}

	.progress-fill.variant-boredom {
		background: linear-gradient(to right, var(--ctp-blue), var(--ctp-peach));
	}

	.progress-fill.variant-health {
		/* Uses gradientColor prop for dynamic color */
	}

	.progress-fill.variant-tier {
		background: linear-gradient(to right, var(--ctp-pink), var(--ctp-flamingo));
	}

	.progress-fill.variant-affection {
		background: linear-gradient(to right, var(--ctp-rosewater), var(--ctp-pink), var(--ctp-flamingo));
		box-shadow: 0 0 8px rgba(234, 118, 203, 0.4);
	}
</style>
