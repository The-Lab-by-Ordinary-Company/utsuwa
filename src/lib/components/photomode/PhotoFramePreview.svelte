<script lang="ts">
	import { photomodeStore } from '$lib/stores/photomode.svelte';
	import { drawPhotoFrame } from '$lib/services/photo-capture';

	// Live frame preview drawn with the exact same code the capture composite
	// uses, so the polaroid band and film bars land where the saved file will
	// have them. Sits under the sticker layer, matching the capture order.

	let canvas = $state<HTMLCanvasElement | null>(null);

	$effect(() => {
		const frame = photomodeStore.frameId;
		const el = canvas;
		if (!el) return;

		const draw = () => {
			const dpr = window.devicePixelRatio || 1;
			const w = Math.round(el.clientWidth * dpr);
			const h = Math.round(el.clientHeight * dpr);
			if (w === 0 || h === 0) return;
			if (el.width !== w || el.height !== h) {
				el.width = w;
				el.height = h;
			}
			const ctx = el.getContext('2d');
			if (!ctx) return;
			ctx.clearRect(0, 0, w, h);
			drawPhotoFrame(ctx, w, h, frame);
		};

		draw();
		const observer = new ResizeObserver(draw);
		observer.observe(el);
		return () => observer.disconnect();
	});
</script>

<canvas class="frame-preview" bind:this={canvas} aria-hidden="true"></canvas>

<style>
	.frame-preview {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 2;
		pointer-events: none;
	}
</style>
