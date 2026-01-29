<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import { page } from '$app/state';
	import type { DocsNavSection } from '$lib/config/docs-nav';

	interface Props {
		section: DocsNavSection;
	}

	let { section }: Props = $props();
</script>

<div class="section">
	<div class="section-header">
		<Icon name={section.icon} size={14} />
		<span>{section.title}</span>
	</div>
	<ul class="section-items">
		{#each section.items as item}
			{@const href = `/docs/${item.slug}`}
			{@const isActive = page.url.pathname === href}
			<li>
				<a {href} class="section-link" class:active={isActive}>
					{item.title}
				</a>
			</li>
		{/each}
	</ul>
</div>

<style>
	.section {
		margin-bottom: 1.5rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--docs-text);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0 0.75rem;
		margin-bottom: 0.375rem;
	}

	.section-items {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.section-link {
		display: block;
		padding: 0.375rem 0.75rem;
		padding-left: 2rem;
		font-size: 0.8125rem;
		color: var(--docs-text-muted);
		text-decoration: none;
		border-radius: 0.375rem;
		transition: color 0.15s, background 0.15s;
	}

	.section-link:hover {
		color: var(--docs-text);
		background: var(--docs-surface);
	}

	.section-link.active {
		color: var(--docs-accent);
		background: var(--docs-surface);
		font-weight: 500;
	}
</style>
