<script lang="ts">
	import { useThrelte } from '@threlte/core';
	import { onMount } from 'svelte';
	import { initRaycast, cleanupRaycast } from '$lib/services/platform';

	const { scene, camera } = useThrelte();

	onMount(() => {
		// Initialize raycast with the Threlte scene and camera
		if (scene && camera.current) {
			initRaycast(scene, camera.current);
		}

		return () => {
			cleanupRaycast();
		};
	});

	// Re-initialize if camera changes
	$effect(() => {
		if (scene && camera.current) {
			initRaycast(scene, camera.current);
		}
	});
</script>
