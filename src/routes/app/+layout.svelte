<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import UpdateBanner from '$lib/components/updater/UpdateBanner.svelte';

	let { children } = $props();

	// Crossfade app-side navigations (app <-> settings) where supported.
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="app">
	{@render children()}
	<UpdateBanner />
</div>

<style>
	.app {
		height: 100vh;
		width: 100vw;
		overflow: hidden;
	}
</style>
