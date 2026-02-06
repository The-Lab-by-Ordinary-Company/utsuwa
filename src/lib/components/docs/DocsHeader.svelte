<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import DocsSearch from './DocsSearch.svelte';
	import { page } from '$app/state';
	import { browser } from '$app/environment';

	interface Props {
		onToggleSidebar?: () => void;
		sidebarOpen?: boolean;
	}

	let { onToggleSidebar, sidebarOpen = false }: Props = $props();

	const currentPath = $derived(page.url.pathname);

	let searchComponent = $state<DocsSearch | null>(null);

	export function focusSearch() {
		searchComponent?.focus();
	}

	type Theme = 'light' | 'dark' | 'system';

	let theme = $state<Theme>('system');

	if (browser) {
		theme = (localStorage.getItem('docs-theme') as Theme) || 'system';
		applyTheme(theme);
	}

	function applyTheme(t: Theme) {
		if (!browser) return;
		const root = document.documentElement;
		if (t === 'system') {
			root.removeAttribute('data-docs-theme');
		} else {
			root.setAttribute('data-docs-theme', t);
		}
		localStorage.setItem('docs-theme', t);
	}

	function cycleTheme() {
		const order: Theme[] = ['light', 'dark', 'system'];
		const next = order[(order.indexOf(theme) + 1) % order.length];
		theme = next;
		applyTheme(next);
	}

	const iconName = $derived(theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'monitor');
	const label = $derived(theme === 'light' ? 'Light mode' : theme === 'dark' ? 'Dark mode' : 'System theme');
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
		<nav class="header-nav">
			<a href="/docs" class="nav-link" class:active={currentPath.startsWith('/docs')}>Docs</a>
			<a href="/blog" class="nav-link" class:active={currentPath.startsWith('/blog')}>Blog</a>
		</nav>
	</div>
	<div class="header-search">
		<DocsSearch bind:this={searchComponent} id="header-search" />
	</div>
	<a href="/docs" class="logo mobile-logo">
		<img src="/brand-assets/logo.svg" alt="Utsuwa" class="logo-img" />
	</a>
	<div class="header-right">
		<button type="button" class="header-btn" onclick={cycleTheme} aria-label={label} title={label}>
			<Icon name={iconName} size={18} />
		</button>
		<a href="https://github.com/dyascj/utsuwa" target="_blank" rel="noopener noreferrer" class="header-link" aria-label="GitHub">
			<Icon name="github" size={20} />
		</a>
	</div>
</header>

<style>
	.docs-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 3.5rem;
		padding: 0 1.5rem;
		background: var(--docs-glass-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-bottom: 1px solid var(--docs-glass-border);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 4px 16px rgba(0, 0, 0, 0.08),
			0 1px 3px rgba(0, 0, 0, 0.05);
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
		margin-left: 1rem;
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

	.header-link {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		border-radius: 0.5rem;
		color: var(--docs-text-muted);
		background: var(--docs-surface);
		border: 1px solid var(--docs-border);
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.header-link:hover {
		color: var(--docs-text);
		background: var(--docs-surface-solid);
		border-color: var(--docs-border-solid);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 4px 12px rgba(0, 0, 0, 0.1);
		transform: translateY(-1px);
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
		.hamburger {
			display: flex;
		}

		.desktop-logo {
			display: none;
		}

		.header-nav {
			margin-left: 0.5rem;
			gap: 0.125rem;
		}

		.header-search {
			display: none;
		}

		.mobile-logo {
			display: flex;
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
		}

		.docs-header {
			position: relative;
		}
	}
</style>
