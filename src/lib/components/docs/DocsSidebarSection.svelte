<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import { page } from '$app/state';
	import { localPath } from '$lib/config/links';
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
			{@const href = localPath('docs', `/${item.slug}`)}
			{@const isActive = page.url.pathname === href}
			<li>
				<a {href} class="section-link" class:active={isActive} aria-current={isActive ? 'page' : undefined}>
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
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--docs-text);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 0.5rem 0.75rem;
		margin-bottom: 0.375rem;
	}

	.section-items {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.section-link {
		display: block;
		padding: 0.5rem 0.75rem;
		padding-left: 2rem;
		font-size: 0.8125rem;
		color: var(--docs-text-muted);
		text-decoration: none;
		border-radius: var(--radius-md);
		transition: color 0.15s ease, background 0.15s ease;
	}

	.section-link:hover {
		color: var(--docs-text);
		background: var(--bg-secondary);
	}

	.section-link.active {
		color: var(--accent);
		background: var(--accent-muted);
		font-weight: 600;
	}

	@media (max-width: 768px) {
		.section-items {
			gap: 0.25rem;
		}

		.section-link {
			padding: 0.625rem 0.75rem;
			padding-left: 2rem;
			min-height: 2.75rem;
			display: flex;
			align-items: center;
		}
	}
</style>
