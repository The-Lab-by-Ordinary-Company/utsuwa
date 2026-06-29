<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { modulesStore } from '$lib/stores/modules.svelte';
	import { moduleRegistry } from '$lib/services/modules';
	import { isDesktopBuild } from '$lib/services/platform/platform';
	import { SITE_URL } from '$lib/config/site';

	let { children } = $props();

	// Marketing/content routes that should never live inside the desktop app.
	const isWebOnly = (path: string) =>
		path === '/' || path.startsWith('/docs') || path.startsWith('/blog');

	// The desktop build must only ever show the app. The window now boots at
	// "/app" (tauri.conf.json), but this also bounces any web-only route to the
	// app as a safety net, using the build-time flag so it can't race.
	const redirecting = $derived(browser && isDesktopBuild() && isWebOnly(page.url.pathname));

	if (browser) {
		for (const mod of moduleRegistry) {
			modulesStore.registerModule(mod);
		}

		// React to system theme changes in real-time when using "system" mode
		const themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
		themeQuery.addEventListener('change', () => {
			const colorMode = localStorage.getItem('colorMode') || 'system';
			if (colorMode === 'system') {
				document.documentElement.classList.toggle('dark', themeQuery.matches);
			}
		});

		// In the desktop app, marketing/docs/blog links open in the system
		// browser instead of navigating the webview.
		document.addEventListener('click', (e) => {
			if (!isDesktopBuild()) return;
			const anchor = (e.target as Element).closest('a');
			if (!anchor) return;
			const href = anchor.getAttribute('href');
			if (href && isWebOnly(href)) {
				e.preventDefault();
				e.stopPropagation();
				import('@tauri-apps/plugin-opener').then(({ openUrl }) => {
					openUrl(`${SITE_URL}${href}`);
				});
			}
		}, true);
	}

	// Bounce the desktop app off the landing route into the app itself.
	$effect(() => {
		if (redirecting) goto('/app', { replaceState: true });
	});
</script>

<svelte:head>
	<title>Utsuwa</title>
	<meta name="description" content="Open-source AI companion with 3D VRM avatars, voice chat, semantic memory, and multi-provider LLM support. Self-hosted and privacy-first." />
</svelte:head>

{#if !redirecting}
	{@render children()}
{/if}
