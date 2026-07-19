<script lang="ts">
	import { fadeFast } from '$lib/utils/motion';

	interface Props {
		label: string;
	}

	let { label }: Props = $props();
</script>

{#key label}
	<span class="shimmer-label" in:fadeFast={{ duration: 150 }}>{label}</span>
{/key}

<style>
	.shimmer-label {
		display: inline-block;
		font-size: 0.8125rem;
		font-weight: 500;
		background: linear-gradient(
			90deg,
			var(--text-tertiary) 0%,
			var(--text-primary) 50%,
			var(--text-tertiary) 100%
		);
		background-size: 200% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		animation: shimmer-sweep 2s linear infinite;
	}

	@keyframes shimmer-sweep {
		from {
			background-position: 200% 0;
		}
		to {
			background-position: -200% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.shimmer-label {
			animation: none;
			background: none;
			color: var(--text-secondary);
		}
	}
</style>
