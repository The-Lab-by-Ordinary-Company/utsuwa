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
		max-width: 120px;
		max-height: 150px;
		object-fit: cover;
		border-radius: 0.875rem;
		/* a held-up photo: white frame, soft shadow, slight tilt */
		border: 4px solid white;
		box-shadow:
			0 10px 28px rgba(0, 0, 0, 0.28),
			0 3px 8px rgba(0, 0, 0, 0.16);
		transform: rotate(-2.5deg);
	}

	.thinking-image:nth-child(even) {
		transform: rotate(2.5deg);
	}

	:global(.dark) .thinking-image {
		border-color: #2a2a2a;
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
