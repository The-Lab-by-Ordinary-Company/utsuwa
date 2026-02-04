<script lang="ts">
	import { onMount } from 'svelte';
	let { children } = $props();

	// Make html/body transparent for overlay mode
	onMount(() => {
		document.documentElement.style.background = 'transparent';
		document.body.style.background = 'transparent';

		return () => {
			document.documentElement.style.background = '';
			document.body.style.background = '';
		};
	});
</script>

<div class="overlay-app">
	{@render children()}
</div>

<style>
	.overlay-app {
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		background: transparent;
	}
</style>
