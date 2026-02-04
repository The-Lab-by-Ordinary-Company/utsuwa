<script lang="ts">
	let { children } = $props();
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
