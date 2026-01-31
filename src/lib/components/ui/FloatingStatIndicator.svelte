<script lang="ts">
	import { browser } from '$app/environment';
	import Icon from './Icon.svelte';

	interface Props {
		stat: string;
		delta: number;
		color: string;
		icon: string;
		onComplete?: () => void;
	}

	let { stat, delta, color, icon, onComplete }: Props = $props();

	// Design language colors (matching --bg-primary tokens)
	const INDICATOR_COLORS = {
		light: {
			background: '#ffffff',
			border: 'rgba(0, 0, 0, 0.08)'
		},
		dark: {
			background: '#0a0a0a',
			border: 'rgba(255, 255, 255, 0.1)'
		}
	};

	// Detect dark mode
	let isDark = $state(false);
	$effect(() => {
		if (browser) {
			const checkDark = () => {
				isDark = document.documentElement.classList.contains('dark');
			};
			checkDark();
			const observer = new MutationObserver(checkDark);
			observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
			return () => observer.disconnect();
		}
	});

	const bgColor = $derived(isDark ? INDICATOR_COLORS.dark.background : INDICATOR_COLORS.light.background);
	const borderColor = $derived(isDark ? INDICATOR_COLORS.dark.border : INDICATOR_COLORS.light.border);

	// Trigger completion callback after animation
	$effect(() => {
		const timer = setTimeout(() => {
			onComplete?.();
		}, 2000);

		return () => clearTimeout(timer);
	});
</script>

<div class="indicator" style="--stat-color: {color}; background: {bgColor}; border-color: {borderColor}">
	<Icon name={icon} size={14} />
	<span class="delta">{delta > 0 ? '+' : ''}{delta}</span>
</div>

<style>
	.indicator {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.625rem;
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-radius: 1rem;
		border: 1px solid;
		color: var(--stat-color);
		font-weight: 600;
		font-size: 0.875rem;
		white-space: nowrap;
		box-shadow: var(--shadow-md);
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

</style>
