<script lang="ts">
	import { Icon } from '$lib/components/ui';

	interface Props {
		value: number;
		max?: number;
		size?: number;
		strokeWidth?: number;
		color?: string;
		iconName?: string;
		label?: string;
		showPercentage?: boolean;
		class?: string;
	}

	let {
		value,
		max = 100,
		size = 80,
		strokeWidth = 8,
		color = 'var(--ctp-pink)',
		iconName,
		label,
		showPercentage = true,
		class: className = ''
	}: Props = $props();

	const percentage = $derived(Math.min(100, Math.max(0, (value / max) * 100)));
	const radius = $derived((size - strokeWidth) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const strokeDashoffset = $derived(circumference - (percentage / 100) * circumference);
</script>

<div class="circular-gauge {className}" style="--size: {size}px">
	<svg width={size} height={size} viewBox="0 0 {size} {size}">
		<!-- Background circle -->
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke="var(--bg-tertiary)"
			stroke-width={strokeWidth}
		/>
		<!-- Progress circle -->
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke={color}
			stroke-width={strokeWidth}
			stroke-linecap="round"
			stroke-dasharray={circumference}
			stroke-dashoffset={strokeDashoffset}
			transform="rotate(-90 {size / 2} {size / 2})"
			class="progress-ring"
		/>
	</svg>

	<div class="gauge-content">
		{#if iconName}
			<span class="gauge-icon" style="color: {color}">
				<Icon name={iconName} size={Math.round(size * 0.22)} />
			</span>
		{/if}
		{#if showPercentage}
			<span class="gauge-value">{Math.round(percentage)}%</span>
		{/if}
	</div>

	{#if label}
		<span class="gauge-label">{label}</span>
	{/if}
</div>

<style>
	.circular-gauge {
		position: relative;
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	svg {
		transform: rotate(0deg);
	}

	.progress-ring {
		transition: stroke-dashoffset 0.5s ease-out;
	}

	.gauge-content {
		position: absolute;
		top: 0;
		left: 0;
		width: var(--size);
		height: var(--size);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.gauge-icon {
		display: flex;
		line-height: 1;
	}

	.gauge-value {
		font-size: calc(var(--size) * 0.16);
		font-weight: 600;
		color: var(--text-primary);
	}

	.gauge-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-weight: 500;
	}
</style>
