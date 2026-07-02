<script lang="ts">
	import { getPrevNext } from '$lib/utils/docs-nav';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { localPath } from '$lib/config/links';

	interface Props {
		slug: string;
	}

	let { slug }: Props = $props();

	const { prev, next } = $derived(getPrevNext(slug));
</script>

<nav class="prev-next" aria-label="Page navigation">
	{#if prev}
		<a href={localPath('docs', `/${prev.slug}`)} class="nav-link prev">
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
		<a href={localPath('docs', `/${next.slug}`)} class="nav-link next">
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
		gap: 1.25rem;
		margin-top: 4rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border-subtle);
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		background: var(--bg-tertiary);
		border: none;
		border-radius: var(--radius-lg);
		text-decoration: none !important;
		color: var(--text-primary);
		transition: box-shadow 0.2s ease, transform 0.2s ease;
		box-shadow: var(--shadow-sm);
	}

	.nav-link:hover {
		transform: translateY(-3px);
		box-shadow: var(--shadow-md);
	}

	.nav-link:active {
		transform: translateY(-1px);
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
		gap: 0.375rem;
	}

	.prev .nav-text {
		text-align: left;
	}

	.next .nav-text {
		text-align: right;
	}

	.label {
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-secondary);
	}

	.title {
		font-weight: 600;
		font-size: 0.9375rem;
		color: var(--text-primary);
		transition: color 0.15s;
	}

	.nav-link:hover .title {
		color: var(--accent);
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
