<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { modulesStore } from '$lib/stores/modules.svelte';
	import { moduleRegistry } from '$lib/services/modules';
	import { isTauri } from '$lib/services/platform/platform';
	import { SITE_URL } from '$lib/config/site';

	let { children } = $props();

	if (browser) {
		for (const mod of moduleRegistry) {
			modulesStore.registerModule(mod);
		}

		// In the desktop app, open docs/blog links in the system browser
		document.addEventListener('click', (e) => {
			if (!isTauri()) return;
			const anchor = (e.target as Element).closest('a');
			if (!anchor) return;
			const href = anchor.getAttribute('href');
			if (href && (href.startsWith('/docs') || href.startsWith('/blog'))) {
				e.preventDefault();
				window.open(`${SITE_URL}${href}`, '_blank');
			}
		});
	}
</script>

<svelte:head>
	<title>Utsuwa</title>
	<meta name="description" content="VRM Avatar Viewer with Chat & TTS" />
</svelte:head>

{@render children()}
