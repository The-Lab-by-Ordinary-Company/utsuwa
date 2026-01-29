<script lang="ts">
	import DocsSidebarSection from './DocsSidebarSection.svelte';
	import DocsSearch from './DocsSearch.svelte';
	import { docsNav } from '$lib/config/docs-nav';

	interface Props {
		mobileOpen?: boolean;
	}

	let { mobileOpen = false }: Props = $props();

	let searchComponent = $state<DocsSearch | null>(null);

	export function focusSearch() {
		searchComponent?.focus();
	}
</script>

<aside class="sidebar" class:mobile-open={mobileOpen}>
	<div class="sidebar-search">
		<DocsSearch bind:this={searchComponent} id="sidebar-search" />
	</div>
	<nav class="sidebar-nav">
		{#each docsNav as section}
			<DocsSidebarSection {section} />
		{/each}
	</nav>
</aside>

<style>
	.sidebar {
		width: 240px;
		min-width: 240px;
		max-height: calc(100vh - 3.5rem);
		position: sticky;
		top: 3.5rem;
		align-self: flex-start;
		overflow-y: auto;
		padding: 1.5rem 0.75rem;
		border-right: 1px solid var(--docs-border);
		background: var(--docs-bg);
	}

	.sidebar-search {
		display: none;
		padding: 0 0.25rem;
		margin-bottom: 1rem;
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
	}

	@media (max-width: 768px) {
		.sidebar {
			display: none;
			position: fixed;
			top: 3.5rem;
			left: 0;
			bottom: 0;
			z-index: 20;
			max-height: calc(100vh - 3.5rem);
			box-shadow: 4px 0 16px rgba(0, 0, 0, 0.15);
		}

		.sidebar.mobile-open {
			display: block;
		}

		.sidebar-search {
			display: block;
		}
	}
</style>
