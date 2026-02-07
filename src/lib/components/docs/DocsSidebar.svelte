<script lang="ts">
	import DocsSidebarSection from './DocsSidebarSection.svelte';
	import DocsSearch from './DocsSearch.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { docsNav } from '$lib/config/docs-nav';
	import { browser } from '$app/environment';

	interface Props {
		mobileOpen?: boolean;
	}

	let { mobileOpen = false }: Props = $props();

	let searchComponent = $state<DocsSearch | null>(null);

	export function focusSearch() {
		searchComponent?.focus();
	}

	// Theme toggle
	type Theme = 'light' | 'dark' | 'system';
	let theme = $state<Theme>('system');

	if (browser) {
		theme = (localStorage.getItem('colorMode') as Theme) || 'system';
	}

	function cycleTheme() {
		const order: Theme[] = ['light', 'dark', 'system'];
		const next = order[(order.indexOf(theme) + 1) % order.length];
		theme = next;
		if (!browser) return;
		const root = document.documentElement;
		if (next === 'system') {
			root.removeAttribute('data-docs-theme');
		} else {
			root.setAttribute('data-docs-theme', next);
		}
		// Sync .dark class for the main app
		const isDark = next === 'dark' || (next === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
		root.classList.toggle('dark', isDark);
		localStorage.setItem('colorMode', next);
	}

	const iconName = $derived(theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'monitor');
	const label = $derived(theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System');
</script>

<aside class="sidebar" class:mobile-open={mobileOpen}>
	<div class="sidebar-top">
		<div class="sidebar-search">
			<DocsSearch bind:this={searchComponent} id="sidebar-search" />
		</div>
		<nav class="sidebar-nav">
			{#each docsNav as section}
				<DocsSidebarSection {section} />
			{/each}
		</nav>
	</div>
	<div class="sidebar-footer">
		<button type="button" class="footer-btn" onclick={cycleTheme} title={label}>
			<Icon name={iconName} size={14} />
			<span>{label}</span>
		</button>
		<a href="https://github.com/dyascj/utsuwa" target="_blank" rel="noopener noreferrer" class="footer-btn" title="GitHub">
			<Icon name="github" size={14} />
		</a>
	</div>
</aside>

<style>
	.sidebar {
		width: 240px;
		min-width: 240px;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: var(--docs-bg);
	}

	.sidebar-top {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem;
		scrollbar-width: thin;
		scrollbar-color: transparent transparent;
	}

	.sidebar-top:hover {
		scrollbar-color: rgba(128, 128, 128, 0.3) transparent;
	}

	.sidebar-search {
		margin-bottom: 1rem;
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.sidebar-footer {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.625rem 0.75rem;
		border-top: 1px solid var(--docs-border);
	}

	.footer-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.5rem;
		font-size: 0.6875rem;
		font-weight: 500;
		color: var(--docs-text-muted);
		background: none;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.footer-btn:hover {
		color: var(--docs-text);
		background: var(--docs-surface);
	}

	@media (max-width: 768px) {
		.sidebar {
			display: none;
			position: fixed;
			top: 3.5rem;
			left: 0;
			bottom: 0;
			z-index: 20;
			height: calc(100vh - 3.5rem);
			box-shadow: 8px 0 32px rgba(0, 0, 0, 0.15);
		}

		.footer-btn {
			padding: 0.5rem 0.625rem;
			min-height: 2.5rem;
		}

		.sidebar.mobile-open {
			display: flex;
		}
	}
</style>
