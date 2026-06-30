<script lang="ts">
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		images: { id: string; url: string }[];
		show: boolean;
	}

	let { images, show }: Props = $props();

	// Track the head the same way the speech bubble does, and sit just above it.
	const screenPos = $derived(vrmStore.headScreenPosition);
	const style = $derived(() => {
		const x = screenPos ? Math.min(Math.max(screenPos.x, 8), 92) : 50;
		const y = screenPos ? Math.min(Math.max(screenPos.y - 4, 6), 60) : 22;
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
		transform: translate(-50%, -100%);
		display: flex;
		gap: 0.4rem;
		z-index: 35;
		pointer-events: none;
		animation: float 3s ease-in-out infinite;
	}

	.thinking-image {
		/* clean square thumbnail preview */
		width: 72px;
		height: 72px;
		object-fit: cover;
		border-radius: 0.875rem;
		border: 2px solid rgba(255, 255, 255, 0.9);
		box-shadow:
			0 8px 22px rgba(0, 0, 0, 0.22),
			0 2px 6px rgba(0, 0, 0, 0.14);
	}

	:global(.dark) .thinking-image {
		border-color: rgba(255, 255, 255, 0.12);
	}

	@keyframes float {
		0%,
		100% {
			translate: 0 0;
		}
		50% {
			translate: 0 -8px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.thinking-images {
			animation: none;
		}
	}
</style>
