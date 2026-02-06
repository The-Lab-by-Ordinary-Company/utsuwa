<script lang="ts">
	import DocsHeader from '$lib/components/docs/DocsHeader.svelte';
	import DocsSidebar from '$lib/components/docs/DocsSidebar.svelte';
	import { lightVars, darkVars, resolveTheme, applyVars } from '$lib/config/docs-theme';
	import { page } from '$app/state';
	import { browser } from '$app/environment';

	let { children } = $props();

	const isLandingPage = $derived(page.url.pathname === '/docs');
	let sidebarOpen = $state(false);
	let headerComponent = $state<DocsHeader | null>(null);
	let sidebarComponent = $state<DocsSidebar | null>(null);

	// Close sidebar on navigation
	$effect(() => {
		void page.url.pathname;
		sidebarOpen = false;
	});

	// Keyboard shortcut: Cmd/Ctrl+K to focus search
	$effect(() => {
		if (!browser) return;

		function handleKeydown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				const isMobile = window.innerWidth <= 768;
				if (isMobile) {
					sidebarOpen = true;
					setTimeout(() => sidebarComponent?.focusSearch(), 100);
				} else {
					headerComponent?.focusSearch();
				}
			}
		}

		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});

	let docsEl = $state<HTMLDivElement | null>(null);

	function updateTheme() {
		if (!docsEl) return;
		applyVars(docsEl, resolveTheme() === 'dark' ? darkVars : lightVars);
	}

	$effect(() => {
		if (!docsEl || !browser) return;

		updateTheme();

		const onStorage = () => updateTheme();
		window.addEventListener('storage', onStorage);

		const mql = window.matchMedia('(prefers-color-scheme: dark)');
		mql.addEventListener('change', updateTheme);

		const observer = new MutationObserver(updateTheme);
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-docs-theme'] });

		return () => {
			window.removeEventListener('storage', onStorage);
			mql.removeEventListener('change', updateTheme);
			observer.disconnect();
		};
	});
</script>

<div class="docs" bind:this={docsEl}>
	<DocsHeader bind:this={headerComponent} onToggleSidebar={() => sidebarOpen = !sidebarOpen} {sidebarOpen} />
	<div class="docs-body">
		{#if !isLandingPage}
			{#if sidebarOpen}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="sidebar-overlay" onclick={() => sidebarOpen = false} onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}></div>
			{/if}
			<DocsSidebar bind:this={sidebarComponent} mobileOpen={sidebarOpen} />
		{/if}
		<div class="docs-main" class:full-width={isLandingPage} data-pagefind-body>
			{@render children()}
		</div>
	</div>
</div>

<style>
	.docs {
		min-height: 100vh;
		background: var(--docs-bg);
		color: var(--docs-text);
		font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.docs-body {
		display: flex;
	}

	.docs-main {
		flex: 1;
		min-width: 0;
		max-width: 100%;
	}

	.docs-main.full-width {
		max-width: 100%;
	}

	.sidebar-overlay {
		display: none;
	}

	@media (max-width: 768px) {
		.sidebar-overlay {
			display: block;
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.5);
			backdrop-filter: blur(4px);
			-webkit-backdrop-filter: blur(4px);
			z-index: 19;
		}

		.docs::before,
		.docs::after {
			opacity: 0.25;
		}
	}
</style>
