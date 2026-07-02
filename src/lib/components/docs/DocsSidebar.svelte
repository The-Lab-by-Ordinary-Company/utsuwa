<script lang="ts">
	import DocsSidebarSection from './DocsSidebarSection.svelte';
	import DocsSearch from './DocsSearch.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { docsNav } from '$lib/config/docs-nav';
	import { cycleTheme, getIconName, getLabel } from '$lib/config/docs-theme-toggle.svelte';
	import { GITHUB_REPO } from '$lib/config/site';

	interface Props {
		mobileOpen?: boolean;
	}

	let { mobileOpen = false }: Props = $props();

	let searchComponent = $state<DocsSearch | null>(null);

	export function focusSearch() {
		searchComponent?.focus();
	}

	const iconName = $derived(getIconName());
	const label = $derived(getLabel());
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
		<a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" class="footer-btn" title="GitHub">
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
		background: var(--bg-page);
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
		border-top: 1px solid var(--border-subtle);
	}

	.footer-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.5rem;
		font-size: 0.6875rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--bg-tertiary);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		text-decoration: none;
		transition: background 0.15s ease, color 0.15s ease;
	}

	.footer-btn:hover {
		color: var(--text-primary);
		background: color-mix(in srgb, var(--bg-tertiary), var(--text-primary) 8%);
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
