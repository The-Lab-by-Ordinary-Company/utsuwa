<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { modulesStore } from '$lib/stores/modules.svelte';
	import { moduleRegistry } from '$lib/services/modules';
	import { themeStore } from '$lib/stores/theme.svelte';

	let { children } = $props();

	// Register all modules at app startup (synchronously in browser)
	if (browser) {
		for (const mod of moduleRegistry) {
			modulesStore.registerModule(mod);
		}
	}

	// Initialize theme store (applies saved theme on load)
	const _theme = themeStore.currentThemeId;
</script>

<svelte:head>
	<title>Utsuwa</title>
	<meta name="description" content="VRM Avatar Viewer with Chat & TTS" />
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
