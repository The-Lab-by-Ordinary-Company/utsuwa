<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { modulesStore } from '$lib/stores/modules.svelte';
	import { moduleRegistry } from '$lib/services/modules';
	import { themeStore } from '$lib/stores/theme.svelte';

	let { children } = $props();

	if (browser) {
		for (const mod of moduleRegistry) {
			modulesStore.registerModule(mod);
		}
	}

	const _theme = themeStore.currentThemeId;
</script>

<svelte:head>
	<title>Utsuwa</title>
	<meta name="description" content="VRM Avatar Viewer with Chat & TTS" />
</svelte:head>

{@render children()}
