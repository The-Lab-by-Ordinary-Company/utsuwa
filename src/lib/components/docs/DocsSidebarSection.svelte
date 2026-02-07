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
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--docs-text);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 0.5rem 0.75rem;
		margin-bottom: 0.375rem;
		text-shadow: 0 1px 0 var(--docs-inner-highlight);
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
		border-radius: 0.5rem;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		border: 1px solid transparent;
	}

	.section-link:hover {
		color: var(--docs-text);
		background: var(--docs-surface);
		border-color: var(--docs-border);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.section-link.active {
		color: white;
		background: var(--docs-btn-gradient);
		font-weight: 500;
		border-color: rgba(0, 0, 0, 0.1);
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.3) inset,
			0 0 12px var(--docs-glow),
			0 2px 6px rgba(1, 178, 255, 0.3);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
	}

	.section-link.active:hover {
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.4) inset,
			0 0 16px var(--docs-glow-strong),
			0 4px 8px rgba(1, 178, 255, 0.35);
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
