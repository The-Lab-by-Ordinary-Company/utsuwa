<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="app">
	{@render children()}
</div>

<style>
	.app {
		height: 100vh;
		width: 100vw;
		overflow: hidden;
	}
</style>
