<script lang="ts">
	import DocsHeader from '$lib/components/docs/DocsHeader.svelte';
	import DocsSidebar from '$lib/components/docs/DocsSidebar.svelte';
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
					// Wait for sidebar to open, then focus
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

	// Use the same colors as the main app (from app.css)
	// Light mode uses subtle blue tint, dark mode uses pure blacks
	const lightVars = {
		'--docs-bg': '#f7f7f8',
		'--docs-bg-solid': '#ffffff',
		'--docs-text': '#1a1a1a',
		'--docs-text-muted': '#666666',
		'--docs-border': '#e5e5e5',
		'--docs-border-solid': '#e5e5e5',
		'--docs-surface': 'rgba(255, 255, 255, 0.8)',
		'--docs-surface-solid': '#ffffff',
		'--docs-code-bg': 'rgba(247, 247, 248, 0.9)',
		'--docs-accent': '#01B2FF',
		'--docs-accent-light': '#4dd0ff',
		'--docs-accent-dark': '#0099dd',
		'--docs-accent-hover': '#0099dd',
		'--docs-logo-filter': 'brightness(0)',
		'--docs-glow': 'rgba(1, 178, 255, 0.35)',
		'--docs-glow-strong': 'rgba(1, 178, 255, 0.5)',
		'--docs-inner-highlight': 'rgba(255, 255, 255, 0.6)',
		'--docs-inner-shadow': 'rgba(0, 0, 0, 0.06)',
		'--docs-glass-bg': 'rgba(255, 255, 255, 0.85)',
		'--docs-glass-border': 'rgba(0, 0, 0, 0.08)',
		'--docs-panel-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)',
		'--docs-btn-gradient': 'linear-gradient(180deg, #4dd0ff 0%, #01B2FF 40%, #0099dd 100%)',
		'--docs-btn-gradient-hover': 'linear-gradient(180deg, #66d9ff 0%, #1ebfff 40%, #00a6e6 100%)',
		'--docs-btn-shadow': '0 4px 14px rgba(1, 178, 255, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1)',
		'--docs-btn-shadow-hover': '0 6px 20px rgba(1, 178, 255, 0.5), 0 3px 6px rgba(0, 0, 0, 0.15)'
	};

	// Dark mode - use same blacks as main app (#0a0a0a, #171717, #262626)
	const darkVars = {
		'--docs-bg': '#0a0a0a',
		'--docs-bg-solid': '#0a0a0a',
		'--docs-text': '#fafafa',
		'--docs-text-muted': '#a3a3a3',
		'--docs-border': '#262626',
		'--docs-border-solid': '#262626',
		'--docs-surface': 'rgba(23, 23, 23, 0.9)',
		'--docs-surface-solid': '#171717',
		'--docs-code-bg': 'rgba(23, 23, 23, 0.95)',
		'--docs-accent': '#01B2FF',
		'--docs-accent-light': '#4dd0ff',
		'--docs-accent-dark': '#0099dd',
		'--docs-accent-hover': '#33c1ff',
		'--docs-logo-filter': 'none',
		'--docs-glow': 'rgba(1, 178, 255, 0.3)',
		'--docs-glow-strong': 'rgba(1, 178, 255, 0.45)',
		'--docs-inner-highlight': 'rgba(255, 255, 255, 0.08)',
		'--docs-inner-shadow': 'rgba(0, 0, 0, 0.4)',
		'--docs-glass-bg': 'rgba(23, 23, 23, 0.9)',
		'--docs-glass-border': 'rgba(255, 255, 255, 0.08)',
		'--docs-panel-gradient': 'linear-gradient(180deg, rgba(38,38,38,0.6) 0%, rgba(23,23,23,0.9) 100%)',
		'--docs-btn-gradient': 'linear-gradient(180deg, #4dd0ff 0%, #01B2FF 40%, #0099dd 100%)',
		'--docs-btn-gradient-hover': 'linear-gradient(180deg, #66d9ff 0%, #1ebfff 40%, #00a6e6 100%)',
		'--docs-btn-shadow': '0 4px 14px rgba(1, 178, 255, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3)',
		'--docs-btn-shadow-hover': '0 6px 20px rgba(1, 178, 255, 0.4), 0 3px 6px rgba(0, 0, 0, 0.35)'
	};

	function applyVars(vars: Record<string, string>) {
		if (!docsEl) return;
		for (const [key, value] of Object.entries(vars)) {
			docsEl.style.setProperty(key, value);
		}
	}

	function resolveTheme(): 'light' | 'dark' {
		if (!browser) return 'light';
		const stored = localStorage.getItem('docs-theme');
		if (stored === 'light') return 'light';
		if (stored === 'dark') return 'dark';
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}

	function updateTheme() {
		applyVars(resolveTheme() === 'dark' ? darkVars : lightVars);
	}

	$effect(() => {
		if (!docsEl || !browser) return;

		updateTheme();

		// Listen for storage changes (theme toggle fires this indirectly)
		const onStorage = () => updateTheme();
		window.addEventListener('storage', onStorage);

		// Listen for system preference changes
		const mql = window.matchMedia('(prefers-color-scheme: dark)');
		mql.addEventListener('change', updateTheme);

		// Listen for attribute changes on html (theme toggle sets data-docs-theme)
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
