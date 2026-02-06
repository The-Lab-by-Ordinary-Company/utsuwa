<script lang="ts">
	import DocsHero from '$lib/components/docs/DocsHero.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(dateStr: string): string {
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Documentation - Utsuwa</title>
	<meta name="description" content="Utsuwa documentation - guides, setup instructions, and contribution guidelines." />
</svelte:head>

<DocsHero />

{#if data.latestPost}
	<section class="news-section">
		<div class="news-section-inner">
			<h2 class="news-heading">Latest News</h2>
			<a href="/blog/{data.latestPost.slug}" class="blog-card">
				<div class="card-image">
					<img src={data.latestPost.image} alt="" loading="lazy" />
				</div>
				<div class="card-body">
					<time datetime={data.latestPost.date}>{formatDate(data.latestPost.date)}</time>
					<h3>{data.latestPost.title}</h3>
					<p>{data.latestPost.description}</p>
				</div>
			</a>
		</div>
	</section>
{/if}

<style>
	.news-section {
		padding: 3rem 2rem 4rem;
		background: var(--docs-surface);
		border-bottom: 1px solid var(--docs-border);
	}

	.news-section-inner {
		max-width: 640px;
		margin: 0 auto;
	}

	.news-heading {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--docs-text);
		margin: 0 0 1.25rem;
	}

	.blog-card {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		border-radius: 1rem;
		overflow: hidden;
		border: 1px solid var(--docs-glass-border);
		background: var(--docs-glass-bg);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 4px 16px rgba(0, 0, 0, 0.08);
	}

	.blog-card:hover {
		border-color: var(--docs-accent);
		transform: translateY(-4px);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 0 24px var(--docs-glow),
			0 12px 40px rgba(0, 0, 0, 0.15);
	}

	.card-image {
		position: relative;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: var(--docs-surface);
	}

	.card-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.blog-card:hover .card-image img {
		transform: scale(1.03);
	}

	.card-body {
		padding: 1.25rem 1.5rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.card-body time {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--docs-text-muted);
	}

	.card-body h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--docs-text);
		margin: 0;
		transition: color 0.15s ease;
		line-height: 1.4;
	}

	.blog-card:hover .card-body h3 {
		color: var(--docs-accent);
	}

	.card-body p {
		font-size: 0.8125rem;
		color: var(--docs-text-muted);
		line-height: 1.6;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
