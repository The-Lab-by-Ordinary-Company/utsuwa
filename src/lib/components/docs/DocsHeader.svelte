<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import DocsSearch from './DocsSearch.svelte';
	import { browser } from '$app/environment';

	interface Props {
		onToggleSidebar?: () => void;
		sidebarOpen?: boolean;
	}

	let { onToggleSidebar, sidebarOpen = false }: Props = $props();

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
		border-bottom: 1px solid var(--docs-border);
		background: var(--docs-bg);
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
	}

	.logo-img {
		height: 1.5rem;
		width: auto;
		filter: var(--docs-logo-filter, none);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.header-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 0.375rem;
		border-radius: 0.375rem;
		color: var(--docs-text-muted);
		cursor: pointer;
		transition: color 0.15s, background 0.15s;
	}

	.header-btn:hover {
		color: var(--docs-text);
		background: var(--docs-surface);
	}

	.header-link {
		display: flex;
		align-items: center;
		color: var(--docs-text-muted);
		transition: color 0.15s;
	}

	.header-link:hover {
		color: var(--docs-text);
	}

	.hamburger {
		display: none;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 0.375rem;
		border-radius: 0.375rem;
		color: var(--docs-text-muted);
		cursor: pointer;
		transition: color 0.15s, background 0.15s;
	}

	.hamburger:hover {
		color: var(--docs-text);
		background: var(--docs-surface);
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
