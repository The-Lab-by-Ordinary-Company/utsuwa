<script lang="ts">
	import type { PageData } from './$types';
	import { formatDate } from '$lib/utils/format-date';
	import { SITE_URL } from '$lib/config/site';

	let { data }: { data: PageData } = $props();

	const featuredPost = $derived(data.posts[0]);
	const restPosts = $derived(data.posts.slice(1));
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
	<h1 class="blog-title">Blog</h1>
	<p class="blog-subtitle">Development updates and behind-the-scenes notes.</p>

	{#if featuredPost}
		<a href="/blog/{featuredPost.slug}" class="featured-card">
			<div class="featured-image-wrap">
				<img src={featuredPost.image} alt={featuredPost.title} class="featured-image" />
			</div>
			<div class="featured-overlay"></div>
			<div class="featured-content">
				<div class="card-meta">
					<time datetime={featuredPost.date}>{formatDate(featuredPost.date)}</time>
					<span class="card-author">Charles J. (CJ) Dyas</span>
				</div>
				<h2>{featuredPost.title}</h2>
				<p>{featuredPost.description}</p>
			</div>
		</a>
	{/if}

	{#if restPosts.length > 0}
		<div class="blog-grid">
			{#each restPosts as post}
				<a href="/blog/{post.slug}" class="blog-card">
					<div class="card-image">
						<img src={post.image} alt={post.title} loading="lazy" />
					</div>
					<div class="card-body">
						<div class="card-meta">
							<time datetime={post.date}>{formatDate(post.date)}</time>
							<span class="card-author">CJ Dyas</span>
						</div>
						<h2>{post.title}</h2>
						<p>{post.description}</p>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.blog-index {
		max-width: 64rem;
		margin: 0 auto;
	}

	.blog-title {
		font-size: 2.5rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		letter-spacing: -0.03em;
		font-family: var(--font-sans);
		color: var(--docs-text);
	}

	.blog-subtitle {
		font-size: 1rem;
		color: var(--docs-text-muted);
		margin: 0 0 2.5rem 0;
	}

	/* Featured hero card */
	.featured-card {
		position: relative;
		display: block;
		height: 480px;
		border-radius: var(--radius-xl);
		overflow: hidden;
		text-decoration: none;
		margin-bottom: 2rem;
		background: var(--bg-tertiary);
		transition: box-shadow 0.3s ease, transform 0.3s ease;
		box-shadow: var(--shadow-sm);
	}

	.featured-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
	}

	.featured-image-wrap {
		position: absolute;
		inset: 0;
	}

	.featured-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.featured-card:hover .featured-image {
		transform: scale(1.04);
	}

	.featured-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to top,
			rgba(0, 0, 0, 0.75) 0%,
			rgba(0, 0, 0, 0.3) 45%,
			transparent 100%
		);
		z-index: 1;
	}

	.featured-content {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 2.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		z-index: 3;
	}

	.card-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.card-meta time::after {
		content: '\00b7';
		margin-left: 0.5rem;
		opacity: 0.4;
	}

	.featured-content .card-author {
		font-size: 0.8125rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.6);
	}

	.card-body .card-author {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--docs-text-muted);
	}

	.featured-content time {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--docs-accent-light);
	}

	.featured-content h2 {
		font-size: 1.75rem;
		font-weight: 700;
		color: #fff;
		margin: 0;
		line-height: 1.3;
	}

	.featured-content p {
		font-size: 0.9375rem;
		color: rgba(255, 255, 255, 0.75);
		line-height: 1.6;
		margin: 0;
		max-width: 640px;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Grid for remaining posts */
	.blog-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	.blog-card {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		border-radius: var(--radius-xl);
		overflow: hidden;
		background: var(--bg-tertiary);
		box-shadow: var(--shadow-sm);
		transition: box-shadow 0.3s ease, transform 0.3s ease;
		position: relative;
	}

	.blog-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
	}

	.card-image {
		position: relative;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: var(--docs-code-bg);
		margin: 0.5rem 0.5rem 0;
		border-radius: 0.875rem;
	}

	.card-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 0.875rem;
		transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.blog-card:hover .card-image img {
		transform: scale(1.05);
	}

	.card-body {
		padding: 1rem 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		flex: 1;
		position: relative;
		z-index: 2;
	}

	.card-body time {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--docs-accent);
	}

	.card-body h2 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--docs-text);
		margin: 0;
		transition: color 0.15s ease;
		line-height: 1.4;
	}

	.blog-card:hover .card-body h2 {
		color: var(--docs-accent);
	}

	.card-body p {
		font-size: 0.8125rem;
		color: var(--docs-text-muted);
		line-height: 1.6;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	@media (max-width: 640px) {
		.blog-title {
			font-size: 2rem;
		}

		.featured-card {
			height: 360px;
		}

		.featured-content {
			padding: 1.5rem;
		}

		.featured-content h2 {
			font-size: 1.375rem;
		}

		.blog-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
