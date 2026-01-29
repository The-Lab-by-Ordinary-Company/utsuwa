<script lang="ts">
	import { getBreadcrumbs } from '$lib/utils/docs-nav';
	import Icon from '$lib/components/ui/Icon.svelte';

	interface Props {
		slug: string;
	}

	let { slug }: Props = $props();

	const breadcrumbs = $derived(getBreadcrumbs(slug));
</script>

<nav class="breadcrumbs" aria-label="Breadcrumb">
	{#each breadcrumbs as crumb, i}
		{#if i > 0}
			<Icon name="chevron-right" size={12} />
		{/if}
		{#if i === breadcrumbs.length - 1}
			<span class="current">{crumb.title}</span>
		{:else if crumb.href}
			<a href={crumb.href}>{crumb.title}</a>
		{:else}
			<span class="section">{crumb.title}</span>
		{/if}
	{/each}
</nav>

<style>
	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--docs-text-muted);
		margin-bottom: 1.5rem;
	}

	.breadcrumbs a {
		color: var(--docs-text-muted);
		text-decoration: none;
		transition: color 0.15s;
	}

	.breadcrumbs a:hover {
		color: var(--docs-accent);
	}

	.section {
		color: var(--docs-text-muted);
	}

	.current {
		color: var(--docs-text);
		font-weight: 500;
	}
</style>
