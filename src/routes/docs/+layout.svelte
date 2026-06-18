<script lang="ts">
	import DocsHeader from '$lib/components/docs/DocsHeader.svelte';
	import DocsSidebar from '$lib/components/docs/DocsSidebar.svelte';
	import { setupThemeWatcher } from '$lib/config/docs-theme';
	import { page } from '$app/state';
	import { browser } from '$app/environment';

	let { children } = $props();

	let sidebarOpen = $state(false);
	let sidebarComponent = $state<DocsSidebar | null>(null);

	// Close sidebar on navigation
	$effect(() => {
		void page.url.pathname;
		sidebarOpen = false;
	});

	// Keyboard shortcut: Cmd/Ctrl+K to focus search in sidebar
	$effect(() => {
		if (!browser) return;

		function handleKeydown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				const isMobile = window.innerWidth <= 768;
				if (isMobile) {
					sidebarOpen = true;
				}
				setTimeout(() => sidebarComponent?.focusSearch(), 50);
			}
		}

		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});

	let docsEl = $state<HTMLDivElement | null>(null);

	$effect(() => setupThemeWatcher(() => docsEl, browser));
</script>

<div class="docs" bind:this={docsEl}>
	<DocsHeader
		onToggleSidebar={() => sidebarOpen = !sidebarOpen}
		{sidebarOpen}
		hideSearch
		hideThemeToggle
	/>
	<div class="docs-body">
		{#if sidebarOpen}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="sidebar-overlay" onclick={() => sidebarOpen = false} onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}></div>
		{/if}
		<DocsSidebar bind:this={sidebarComponent} mobileOpen={sidebarOpen} />
		<div class="docs-main" data-pagefind-body>
			{@render children()}
		</div>
	</div>
</div>

<style>
	.docs {
		min-height: 100vh;
		background: var(--docs-bg);
		color: var(--docs-text);
		font-family: 'M PLUS Rounded 1c', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.docs-body {
		display: flex;
		height: calc(100vh - 3.5rem);
		overflow: hidden;
	}

	.docs-main {
		position: relative;
		flex: 1;
		min-width: 0;
		background: var(--docs-surface-solid);
		border-radius: 0.75rem;
		margin: 0.5rem;
		margin-left: 0;
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: transparent transparent;
	}

	/* Ambient Frutiger Aero blue glow at the top of the content surface */
	.docs-main::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 280px;
		background: radial-gradient(72% 100% at 50% 0%, var(--docs-glow) 0%, transparent 72%);
		opacity: 0.5;
		pointer-events: none;
		z-index: 0;
	}

	/* Keep page content above the glow */
	.docs-main > :global(*) {
		position: relative;
		z-index: 1;
	}

	.docs-main:hover {
		scrollbar-color: rgba(128, 128, 128, 0.3) transparent;
	}

	.sidebar-overlay {
		display: none;
	}

	@media (max-width: 768px) {
		.docs-body {
			height: auto;
			overflow: visible;
		}

		.docs-main {
			border-radius: 0;
			margin: 0;
		}

		.sidebar-overlay {
			display: block;
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.5);
			backdrop-filter: blur(4px);
			-webkit-backdrop-filter: blur(4px);
			z-index: 19;
		}
	}
</style>
