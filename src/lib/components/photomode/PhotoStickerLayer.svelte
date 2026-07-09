<script lang="ts">
	import { photomodeStore } from '$lib/stores/photomode.svelte';

	// Draggable sticker overlay. Positions are viewport fractions, so the
	// capture composite reproduces exactly what the user arranged. The layer
	// itself is click-through; only the stickers take pointer events, so taps
	// and orbiting still reach the scene.

	let layer = $state<HTMLDivElement | null>(null);
	let dragging: { id: string; offsetX: number; offsetY: number } | null = null;

	function onStickerDown(e: PointerEvent, id: string) {
		if (!layer) return;
		const rect = layer.getBoundingClientRect();
		const sticker = photomodeStore.stickers.find((s) => s.id === id);
		if (!sticker) return;
		dragging = {
			id,
			offsetX: (e.clientX - rect.left) / rect.width - sticker.x,
			offsetY: (e.clientY - rect.top) / rect.height - sticker.y
		};
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		e.stopPropagation();
	}

	function onStickerMove(e: PointerEvent) {
		if (!dragging || !layer) return;
		const rect = layer.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width - dragging.offsetX;
		const y = (e.clientY - rect.top) / rect.height - dragging.offsetY;
		photomodeStore.updateSticker(dragging.id, {
			x: Math.min(Math.max(x, 0), 1),
			y: Math.min(Math.max(y, 0), 1)
		});
	}

	function onStickerUp() {
		dragging = null;
	}

	function onStickerWheel(e: WheelEvent, id: string) {
		const sticker = photomodeStore.stickers.find((s) => s.id === id);
		if (!sticker) return;
		e.preventDefault();
		const next = sticker.width * (e.deltaY < 0 ? 1.08 : 0.93);
		photomodeStore.updateSticker(id, { width: Math.min(Math.max(next, 0.04), 0.7) });
	}
</script>

<div class="sticker-layer" bind:this={layer} aria-hidden="true">
	{#each photomodeStore.stickers as sticker (sticker.id)}
		<img
			class="sticker"
			src={sticker.src}
			alt=""
			draggable="false"
			style:left={`${sticker.x * 100}%`}
			style:top={`${sticker.y * 100}%`}
			style:width={`${sticker.width * 100}%`}
			onpointerdown={(e) => onStickerDown(e, sticker.id)}
			onpointermove={onStickerMove}
			onpointerup={onStickerUp}
			onpointercancel={onStickerUp}
			onlostpointercapture={onStickerUp}
			onwheel={(e) => onStickerWheel(e, sticker.id)}
			ondblclick={() => photomodeStore.removeSticker(sticker.id)}
			title="Drag to move, scroll to resize, double-click to remove"
		/>
	{/each}
</div>

<style>
	.sticker-layer {
		position: absolute;
		inset: 0;
		z-index: 3; /* above frame and vignette, below the panel */
		pointer-events: none;
		overflow: hidden;
	}

	.sticker {
		position: absolute;
		transform: translate(-50%, -50%);
		pointer-events: auto;
		cursor: grab;
		user-select: none;
		-webkit-user-drag: none;
		touch-action: none;
	}

	.sticker:active {
		cursor: grabbing;
	}
</style>
