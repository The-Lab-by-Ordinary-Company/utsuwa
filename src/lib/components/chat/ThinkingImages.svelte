<script lang="ts">
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		images: { id: string; url: string }[];
		show: boolean;
	}

	let { images, show }: Props = $props();

	// Track her head, then sit off to the side (upper-left), clear of the speech
	// bubble which lives to the right.
	const screenPos = $derived(vrmStore.headScreenPosition);
	const style = $derived(() => {
		const x = screenPos ? Math.min(Math.max(screenPos.x - 8, 6), 80) : 40;
		const y = screenPos ? Math.min(Math.max(screenPos.y - 6, 6), 60) : 22;
		return `top: ${y}%; left: ${x}%;`;
	});
</script>

{#if show && images.length > 0}
	<div class="thinking-images" style={style()} transition:fade={{ duration: 260 }}>
		{#each images as img (img.id)}
			<img src={img.url} alt="" class="thinking-image" />
		{/each}
	</div>
{/if}

<style>
	.thinking-images {
		position: fixed;
		transform: translate(-50%, -50%);
		display: flex;
		gap: 0.4rem;
		z-index: 35;
		pointer-events: none;
	}

	.thinking-image {
		/* clean square thumbnail preview */
		width: 72px;
		height: 72px;
		object-fit: cover;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-sm);
		transform-origin: center bottom;
		animation: dance 1.1s ease-in-out infinite;
	}

	/* a little hop-and-sway while she thinks */
	@keyframes dance {
		0% {
			transform: translateY(0) rotate(-8deg);
		}
		25% {
			transform: translateY(-9px) rotate(0deg) scale(0.96, 1.06);
		}
		50% {
			transform: translateY(0) rotate(8deg);
		}
		75% {
			transform: translateY(-9px) rotate(0deg) scale(0.96, 1.06);
		}
		100% {
			transform: translateY(0) rotate(-8deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.thinking-image {
			animation: none;
		}
	}
</style>
