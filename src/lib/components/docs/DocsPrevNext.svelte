<script lang="ts">
	import { getPrevNext } from '$lib/utils/docs-nav';
	import Icon from '$lib/components/ui/Icon.svelte';

	interface Props {
		slug: string;
	}

	let { slug }: Props = $props();

	const { prev, next } = $derived(getPrevNext(slug));
</script>

<nav class="prev-next" aria-label="Page navigation">
	{#if prev}
		<a href="/docs/{prev.slug}" class="nav-link prev">
			<Icon name="chevron-left" size={16} />
			<div class="nav-text">
				<span class="label">Previous</span>
				<span class="title">{prev.title}</span>
			</div>
		</a>
	{:else}
		<div></div>
	{/if}

	{#if next}
		<a href="/docs/{next.slug}" class="nav-link next">
			<div class="nav-text">
				<span class="label">Next</span>
				<span class="title">{next.title}</span>
			</div>
			<Icon name="chevron-right" size={16} />
		</a>
	{/if}
</nav>

<style>
	.prev-next {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-top: 4rem;
		padding-top: 2rem;
		border-top: 1px solid var(--docs-border);
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 1rem 1.25rem;
		background: var(--docs-surface);
		border-radius: 0.75rem;
		text-decoration: none !important;
		color: var(--docs-text);
		transition: transform 0.15s, box-shadow 0.15s;
	}

	.nav-link:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.prev {
		justify-content: flex-start;
	}

	.next {
		justify-content: flex-end;
		grid-column: 2;
	}

	.nav-text {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.prev .nav-text {
		text-align: left;
	}

	.next .nav-text {
		text-align: right;
	}

	.label {
		font-size: 0.6875rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--docs-text-muted);
	}

	.title {
		font-weight: 600;
		font-size: 0.9375rem;
		color: var(--docs-text);
	}

	.nav-link:hover .title {
		color: var(--docs-accent);
	}

	@media (max-width: 640px) {
		.prev-next {
			grid-template-columns: 1fr;
		}

		.next {
			grid-column: 1;
			flex-direction: row-reverse;
			justify-content: flex-start;
		}

		.next .nav-text {
			text-align: left;
		}
	}
</style>
