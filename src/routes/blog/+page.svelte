<script lang="ts">
	import type { PageData } from './$types';
	import { formatDate } from '$lib/utils/format-date';

	let { data }: { data: PageData } = $props();

	const featuredPost = $derived(data.posts[0]);
	const restPosts = $derived(data.posts.slice(1));
</script>

<svelte:head>
	<title>Blog - Utsuwa</title>
	<meta
		name="description"
		content="Development updates and behind-the-scenes notes from building Utsuwa."
	/>
</svelte:head>

<div class="blog-index">
	<h1 class="blog-title">Blog</h1>
	<p class="blog-subtitle">Development updates and behind-the-scenes notes.</p>

	{#if featuredPost}
		<a href="/blog/{featuredPost.slug}" class="featured-card">
			<div class="featured-image-wrap">
				<img src={featuredPost.image} alt="" class="featured-image" />
			</div>
			<div class="featured-shine"></div>
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
						<img src={post.image} alt="" loading="lazy" />
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
		font-weight: 700;
		color: #1a1a1a;
		margin: 0 0 0.5rem 0;
		letter-spacing: -0.03em;
		font-family: 'Exo 2', sans-serif;
	}

	.blog-subtitle {
		font-size: 1rem;
		color: rgba(0, 0, 0, 0.5);
		margin: 0 0 2.5rem 0;
	}

	/* Featured hero card — glossy Frutiger Aero panel */
	.featured-card {
		position: relative;
		display: block;
		height: 480px;
		border-radius: 1.5rem;
		overflow: hidden;
		text-decoration: none;
		margin-bottom: 2rem;
		background: linear-gradient(
			165deg,
			rgba(255, 255, 255, 0.95) 0%,
			rgba(240, 248, 255, 0.8) 50%,
			rgba(1, 178, 255, 0.08) 100%
		);
		border: 1px solid rgba(1, 178, 255, 0.18);
		transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			inset 0 -1px 0 rgba(0, 0, 0, 0.04),
			0 8px 32px rgba(0, 0, 0, 0.08),
			0 1px 4px rgba(0, 0, 0, 0.05);
	}

	/* Glossy top shine */
	.featured-shine {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 45%;
		background: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.6) 0%,
			rgba(255, 255, 255, 0.1) 60%,
			transparent 100%
		);
		pointer-events: none;
		z-index: 2;
	}

	.featured-card:hover {
		border-color: rgba(1, 178, 255, 0.4);
		transform: translateY(-6px) scale(1.01);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 1),
			0 0 40px rgba(1, 178, 255, 0.15),
			0 12px 48px rgba(1, 178, 255, 0.08),
			0 24px 64px rgba(0, 0, 0, 0.1);
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
			rgba(0, 10, 20, 0.3) 45%,
			rgba(1, 178, 255, 0.03) 100%
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

	.card-author {
		font-size: inherit;
		font-weight: inherit;
		opacity: 0.6;
	}

	.featured-content time {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #4dd0ff;
		text-shadow: 0 0 12px rgba(1, 178, 255, 0.4);
	}

	.featured-content h2 {
		font-size: 1.75rem;
		font-weight: 700;
		color: white;
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
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Grid for remaining posts */
	.blog-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

	/* Grid cards — Frutiger Aero light */
	.blog-card {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		border-radius: 1.25rem;
		overflow: hidden;
		background: linear-gradient(
			165deg,
			rgba(255, 255, 255, 0.95) 0%,
			rgba(240, 248, 255, 0.8) 50%,
			rgba(1, 178, 255, 0.08) 100%
		);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(1, 178, 255, 0.18);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			inset 0 -1px 0 rgba(0, 0, 0, 0.04),
			0 4px 20px rgba(0, 0, 0, 0.08),
			0 1px 4px rgba(0, 0, 0, 0.05);
		transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
		position: relative;
	}

	/* Glossy top shine */
	.blog-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 50%;
		background: linear-gradient(
			180deg,
			rgba(255, 255, 255, 0.6) 0%,
			transparent 100%
		);
		border-radius: 1.25rem 1.25rem 0 0;
		pointer-events: none;
		z-index: 1;
	}

	.blog-card:hover {
		border-color: rgba(1, 178, 255, 0.4);
		transform: translateY(-6px) scale(1.02);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 1),
			0 0 30px rgba(1, 178, 255, 0.15),
			0 8px 32px rgba(1, 178, 255, 0.1),
			0 20px 48px rgba(0, 0, 0, 0.1);
	}

	.card-image {
		position: relative;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: linear-gradient(135deg, #e8f0f8 0%, #dde8f2 100%);
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
		color: #01B2FF;
	}

	.card-body h2 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0;
		transition: color 0.15s ease;
		line-height: 1.4;
	}

	.blog-card:hover .card-body h2 {
		color: #01B2FF;
	}

	.card-body p {
		font-size: 0.8125rem;
		color: rgba(0, 0, 0, 0.5);
		line-height: 1.6;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 3;
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
