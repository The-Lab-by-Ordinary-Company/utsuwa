<script lang="ts">
	import type { PageData } from './$types';
	import { formatDate } from '$lib/utils/format-date';
	import { SITE_URL } from '$lib/config/site';

	let { data }: { data: PageData } = $props();

	// Lead story, then two stacked next to it, then everything else in the grid.
	const featured = $derived(data.posts[0]);
	const sidePosts = $derived(data.posts.slice(1, 3));
	const gridPosts = $derived(data.posts.slice(3));
</script>

<svelte:head>
	<title>Blog — Utsuwa | Development Updates & AI Companion News</title>
	<meta
		name="description"
		content="Development updates, release notes, and behind-the-scenes notes from building Utsuwa — the open-source AI companion with 3D VRM avatars."
	/>
	<link rel="canonical" href={`${SITE_URL}/blog`} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Blog — Utsuwa" />
	<meta property="og:description" content="Development updates, release notes, and behind-the-scenes notes from building Utsuwa." />
	<meta property="og:url" content={`${SITE_URL}/blog`} />
	<meta property="og:site_name" content="Utsuwa" />
</svelte:head>

<div class="blog-index">
	<header class="blog-header">
		<h1>Blog</h1>
		<p>Development updates and behind-the-scenes notes.</p>
	</header>

	{#if featured}
		<section class="featured-row">
			<a href="/blog/{featured.slug}" class="post lead">
				<div class="media media-featured">
					<img src={featured.image} alt={featured.title} />
				</div>
				<h2 class="lead-title">{featured.title}</h2>
				<div class="meta">
					<time datetime={featured.date}>{formatDate(featured.date)}</time>
				</div>
			</a>

			{#if sidePosts.length > 0}
				<div class="side-column">
					{#each sidePosts as post}
						<a href="/blog/{post.slug}" class="post side">
							<div class="media media-side">
								<img src={post.image} alt={post.title} loading="lazy" />
							</div>
							<h3 class="post-title">{post.title}</h3>
							<div class="meta">
								<time datetime={post.date}>{formatDate(post.date)}</time>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</section>
	{/if}

	{#if gridPosts.length > 0}
		<section class="post-grid">
			{#each gridPosts as post}
				<a href="/blog/{post.slug}" class="post">
					<div class="media media-grid">
						<img src={post.image} alt={post.title} loading="lazy" />
					</div>
					<h3 class="post-title">{post.title}</h3>
					<div class="meta">
						<time datetime={post.date}>{formatDate(post.date)}</time>
					</div>
				</a>
			{/each}
		</section>
	{/if}
</div>

<style>
	.blog-index {
		max-width: 64rem;
		margin: 0 auto;
	}

	/* Header */
	.blog-header {
		margin-bottom: 3.5rem;
	}

	.blog-header h1 {
		font-size: clamp(2.25rem, 5vw, 3rem);
		font-weight: 600;
		letter-spacing: -0.03em;
		color: var(--text-primary);
		margin: 0;
	}

	.blog-header p {
		font-size: 1.0625rem;
		color: var(--text-secondary);
		margin: 0.75rem 0 0;
	}

	/* Shared link + media (cardless: rounded image, text beneath) */
	.post {
		display: block;
		text-decoration: none;
		color: inherit;
	}

	.media {
		position: relative;
		overflow: hidden;
		border-radius: var(--radius-md);
		background: var(--bg-secondary);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text-primary) 8%, transparent);
	}

	.media img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.post:hover .media img {
		transform: scale(1.03);
	}

	.media-featured {
		aspect-ratio: 16 / 9;
		border-radius: var(--radius-lg);
	}

	.media-side {
		aspect-ratio: 3 / 2;
	}

	.media-grid {
		aspect-ratio: 4 / 3;
	}

	/* Titles */
	.lead-title,
	.post-title {
		color: var(--text-primary);
		font-weight: 600;
		letter-spacing: -0.02em;
		margin: 0;
		transition: color 0.15s ease;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.post:hover .lead-title,
	.post:hover .post-title {
		color: var(--accent);
	}

	.lead-title {
		font-size: clamp(1.5rem, 3vw, 2rem);
		line-height: 1.15;
		margin-top: 1.25rem;
	}

	.post-title {
		font-size: 1.1875rem;
		line-height: 1.3;
		margin-top: 1rem;
	}

	/* Meta (date only; no category field on posts) */
	.meta {
		margin-top: 0.625rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	/* Featured row: lead ~2/3, two stacked ~1/3 */
	.featured-row {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 2.5rem;
		margin-bottom: 4rem;
	}

	.side-column {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	/* Remaining posts */
	.post-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		column-gap: 2rem;
		row-gap: 3rem;
	}

	@media (max-width: 900px) {
		.featured-row {
			grid-template-columns: 1fr;
			gap: 3rem;
		}

		.side-column {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 2rem;
		}

		.post-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 600px) {
		.blog-header {
			margin-bottom: 2.5rem;
		}

		.side-column {
			grid-template-columns: 1fr;
		}

		.post-grid {
			grid-template-columns: 1fr;
			row-gap: 2.5rem;
		}
	}
</style>
