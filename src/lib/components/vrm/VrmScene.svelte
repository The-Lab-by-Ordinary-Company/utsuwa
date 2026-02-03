<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { WebGLRenderer, SRGBColorSpace, ACESFilmicToneMapping } from 'three';
	import { onMount } from 'svelte';
	import Scene from './Scene.svelte';
	import { vrmStore } from '$lib/stores/vrm.svelte';
	import { preGenerateThumbnails } from '$lib/utils/vrmThumbnail';

	interface Props {
		centered?: boolean;
		locked?: boolean;
	}

	let { centered = false, locked = false }: Props = $props();
	let mounted = $state(false);

	// Custom renderer factory for screenshot support
	function createRenderer(canvas: HTMLCanvasElement) {
		const renderer = new WebGLRenderer({
			canvas,
			antialias: true,
			alpha: true,
			preserveDrawingBuffer: true
		});

		// Color management for vibrant, accurate colors
		renderer.outputColorSpace = SRGBColorSpace;
		renderer.toneMapping = ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.0;

		return renderer;
	}

	onMount(() => {
		mounted = true;

		// Pre-generate thumbnails for models without previews on first load
		const modelsNeedingThumbnails = vrmStore.models.filter((m) => !m.previewUrl);
		if (modelsNeedingThumbnails.length > 0) {
			// console.log(`Pre-generating thumbnails for ${modelsNeedingThumbnails.length} models...`);
			preGenerateThumbnails(modelsNeedingThumbnails, (modelId, dataUrl) => {
				vrmStore.setModelPreview(modelId, dataUrl);
				// console.log(`Generated thumbnail for: ${modelId}`);
			});
		}
	});
</script>

<div class="vrm-scene">
	{#if mounted}
		<Canvas {createRenderer}>
			<Scene {centered} {locked} />
		</Canvas>
	{/if}
</div>

<style>
	.vrm-scene {
		width: 100%;
		height: 100%;
	}
</style>
