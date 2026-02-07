<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import DocsSearch from './DocsSearch.svelte';
	import { page } from '$app/state';
	import { cycleTheme, getIconName, getLabel } from '$lib/config/docs-theme-toggle.svelte';
	import { GITHUB_RELEASES } from '$lib/config/site';

	interface Props {
		onToggleSidebar?: () => void;
		sidebarOpen?: boolean;
		hideSearch?: boolean;
		hideThemeToggle?: boolean;
	}

	let { onToggleSidebar, sidebarOpen = false, hideSearch = false, hideThemeToggle = false }: Props = $props();

	const currentPath = $derived(page.url.pathname);

	let searchComponent = $state<DocsSearch | null>(null);

	export function focusSearch() {
		searchComponent?.focus();
	}

	const iconName = $derived(getIconName());
	const label = $derived(getLabel());
</script>

<header class="docs-header">
	<div class="header-left">
		{#if onToggleSidebar}
			<button type="button" class="hamburger" onclick={onToggleSidebar} aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}>
				<Icon name={sidebarOpen ? 'xmark' : 'bars'} size={18} />
			</button>
		{/if}
		<a href="/docs" class="logo desktop-logo">
			<img src="/brand-assets/logo.svg" alt="Utsuwa" class="logo-img" />
		</a>
	</div>
	{#if !hideSearch}
		<div class="header-search">
			<DocsSearch bind:this={searchComponent} id="header-search" />
		</div>
	{/if}
	<a href="/docs" class="logo mobile-logo">
		<img src="/brand-assets/logo.svg" alt="Utsuwa" class="logo-img" />
	</a>
	<div class="header-right">
		<nav class="header-nav">
			<a href="/docs" class="nav-link" class:active={currentPath.startsWith('/docs')}>Docs</a>
			<a href="/blog" class="nav-link" class:active={currentPath.startsWith('/blog')}>Blog</a>
		</nav>
		{#if !hideThemeToggle}
			<button type="button" class="header-btn" onclick={cycleTheme} aria-label={label} title={label}>
				<Icon name={iconName} size={18} />
			</button>
		{/if}
		<a href={GITHUB_RELEASES} target="_blank" rel="noopener noreferrer" class="download-btn">
			<Icon name="download" size={14} />
			Download
		</a>
		<a href="/" class="try-live-btn">Try Live</a>
	</div>
</header>

<style>
	.docs-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 3.5rem;
		padding: 0 1.5rem;
		background: var(--docs-bg);
		border-bottom: 1px solid var(--docs-border);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.header-left {
		display: flex;
		align-items: center;
	}

	.header-search {
		flex: 1;
		display: flex;
		justify-content: center;
		max-width: 320px;
		margin: 0 1rem;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: var(--docs-text);
		transition: transform 0.2s ease, filter 0.2s ease;
	}

	.logo:hover {
		transform: scale(1.02);
	}

	.logo-img {
		height: 1.5rem;
		width: auto;
		filter: var(--docs-logo-filter, none);
		drop-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.header-nav {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.nav-link {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--docs-text-muted);
		text-decoration: none;
		padding: 0.375rem 0.625rem;
		border-radius: 0.375rem;
		transition: all 0.15s ease;
	}

	.nav-link:hover {
		color: var(--docs-text);
		background: var(--docs-surface);
	}

	.nav-link.active {
		color: var(--docs-accent);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.header-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--docs-surface);
		border: 1px solid var(--docs-border);
		padding: 0.5rem;
		border-radius: 0.5rem;
		color: var(--docs-text-muted);
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.header-btn:hover {
		color: var(--docs-accent);
		background: var(--docs-surface-solid);
		border-color: var(--docs-accent);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 0 12px var(--docs-glow),
			0 2px 8px rgba(0, 0, 0, 0.08);
		transform: translateY(-1px);
	}

	.header-btn:active {
		transform: translateY(0);
		box-shadow:
			0 1px 2px var(--docs-inner-shadow) inset,
			0 0 8px var(--docs-glow);
	}

	.download-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.875rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--docs-text);
		background: var(--docs-glass-bg);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid var(--docs-border);
		border-radius: 0.5rem;
		text-decoration: none;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.download-btn:hover {
		color: var(--docs-accent);
		border-color: var(--docs-accent);
		background: var(--docs-surface-solid);
		transform: translateY(-1px);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 0 12px var(--docs-glow),
			0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.download-btn:active {
		transform: translateY(0);
		box-shadow:
			0 1px 2px var(--docs-inner-shadow) inset,
			0 0 8px var(--docs-glow);
	}

	.try-live-btn {
		display: inline-flex;
		align-items: center;
		padding: 0.375rem 0.875rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: white;
		background: var(--docs-btn-gradient);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 0.5rem;
		text-decoration: none;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.3),
			0 2px 6px rgba(1, 178, 255, 0.25);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
	}

	.try-live-btn:hover {
		background: var(--docs-btn-gradient-hover);
		transform: translateY(-1px);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			0 0 16px var(--docs-glow),
			0 4px 12px rgba(1, 178, 255, 0.3);
	}

	.try-live-btn:active {
		transform: translateY(0);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.hamburger {
		display: none;
		align-items: center;
		justify-content: center;
		background: var(--docs-surface);
		border: 1px solid var(--docs-border);
		padding: 0.5rem;
		border-radius: 0.5rem;
		color: var(--docs-text-muted);
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.hamburger:hover {
		color: var(--docs-accent);
		background: var(--docs-surface-solid);
		border-color: var(--docs-accent);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 0 12px var(--docs-glow);
	}

	.mobile-logo {
		display: none;
	}

	@media (max-width: 768px) {
		.docs-header {
			position: relative;
			padding: 0 0.75rem;
		}

		.hamburger {
			display: flex;
			min-width: 2.5rem;
			min-height: 2.5rem;
		}

		.desktop-logo {
			display: none;
		}

		.header-nav {
			gap: 0;
		}

		.nav-link {
			padding: 0.5rem 0.5rem;
			font-size: 0.75rem;
			min-height: 2.5rem;
			display: inline-flex;
			align-items: center;
		}

		.download-btn,
		.try-live-btn {
			padding: 0.4rem 0.75rem;
			font-size: 0.6875rem;
			min-height: 2.25rem;
		}

		.header-search {
			display: none;
		}

		.header-right {
			gap: 0.25rem;
		}

		.mobile-logo {
			display: none;
		}
	}
</style>
