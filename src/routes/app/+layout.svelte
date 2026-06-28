<script lang="ts">
	import UpdateBanner from '$lib/components/updater/UpdateBanner.svelte';

	let { children } = $props();
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
