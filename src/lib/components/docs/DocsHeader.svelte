<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import DocsSearch from './DocsSearch.svelte';
	import { page } from '$app/state';
	import { cycleTheme, getIconName, getLabel } from '$lib/config/docs-theme-toggle.svelte';
	import { GITHUB_RELEASES } from '$lib/config/site';
	import { localPath, sectionUrl, mainUrl, isSection } from '$lib/config/links';

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
		<a href={localPath('docs')} class="logo desktop-logo">
			<img src="/brand-assets/logo.svg" alt="Utsuwa" class="logo-img" />
		</a>
	</div>
	{#if !hideSearch}
		<div class="header-search">
			<DocsSearch bind:this={searchComponent} id="header-search" />
		</div>
	{/if}
	<div class="header-right">
		<nav class="header-nav">
			<a href={localPath('docs')} class="nav-link" class:active={isSection('docs')}>Docs</a>
			<a href={mainUrl('/blog')} class="nav-link" class:active={currentPath.startsWith('/blog')}>Blog</a>
		</nav>
		{#if !hideThemeToggle}
			<button type="button" class="header-btn" onclick={cycleTheme} aria-label={label} title={label}>
				<Icon name={iconName} size={18} />
			</button>
		{/if}
		<a href={GITHUB_RELEASES} target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm download-btn">
			<Icon name="download" size={14} />
			Download
		</a>
		<a href={sectionUrl('app')} class="btn btn-primary btn-sm try-live-btn">Try Live</a>
	</div>
</header>

<style>
	.docs-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 3.5rem;
		padding: 0 1.5rem;
		background: var(--bg-page);
		border-bottom: 1px solid var(--border-subtle);
		position: sticky;
		top: 0;
		z-index: 50;
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
	}

	.header-nav {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.nav-link {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		padding: 0.375rem 0.625rem;
		border-radius: 0.375rem;
		transition: color 0.15s ease, background 0.15s ease;
	}

	.nav-link:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.nav-link.active {
		color: var(--accent);
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
		background: var(--bg-tertiary);
		border: none;
		padding: 0.5rem;
		border-radius: 0.5rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: color 0.15s ease, background 0.15s ease;
	}

	.header-btn:hover {
		color: var(--text-primary);
		background: color-mix(in srgb, var(--bg-tertiary), var(--text-primary) 8%);
	}

	.hamburger {
		display: none;
		align-items: center;
		justify-content: center;
		background: var(--bg-tertiary);
		border: none;
		padding: 0.5rem;
		border-radius: 0.5rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: color 0.15s ease, background 0.15s ease;
	}

	.hamburger:hover {
		color: var(--text-primary);
		background: color-mix(in srgb, var(--bg-tertiary), var(--text-primary) 8%);
	}

	@media (max-width: 768px) {
		.docs-header {
			position: sticky;
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
			min-height: 2.25rem;
		}

		.header-search {
			display: none;
		}

		.header-right {
			gap: 0.25rem;
		}
	}
</style>
