<script lang="ts">
	import type { PageData } from './$types';
	import { formatDate } from '$lib/utils/format-date';
	import { SITE_URL } from '$lib/config/site';

	let { data }: { data: PageData } = $props();

	// The lead story pins beside a longer rail, then releases before the rest of
	// the archive. This mirrors the editorial handoff on OpenAI's homepage.
	const featured = $derived(data.posts[0]);
	const sidePosts = $derived(data.posts.slice(1, 4));
	const gridPosts = $derived(data.posts.slice(4));
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
		<section class="more-stories" aria-labelledby="more-stories-title">
			<div class="more-stories-head">
				<h2 id="more-stories-title">More stories</h2>
			</div>
			<div class="post-grid">
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
			</div>
		</section>
	{/if}
</div>

<style>
	.blog-index {
		max-width: 80rem;
		margin: 0 auto;
	}

	/* Header */
	.blog-header {
		max-width: 42rem;
		margin-bottom: clamp(3.5rem, 7vw, 5.5rem);
	}

	.blog-header h1 {
		font-size: clamp(3rem, 5vw, 4rem);
		font-weight: 500;
		line-height: 0.98;
		letter-spacing: -0.05em;
		color: var(--text-primary);
		margin: 0;
	}

	.blog-header p {
		max-width: 34rem;
		font-size: clamp(1.0625rem, 1.5vw, 1.1875rem);
		line-height: 1.55;
		color: var(--text-secondary);
		margin: 1.25rem 0 0;
	}

	/* Staggered load-in: header first, then posts in reading order */
	.blog-header {
		animation: postRise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	.post {
		animation: postRise 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	.lead {
		animation-delay: 80ms;
	}

	.side-column .post:nth-child(1) {
		animation-delay: 160ms;
	}

	.side-column .post:nth-child(2) {
		animation-delay: 240ms;
	}

	.side-column .post:nth-child(3) {
		animation-delay: 320ms;
	}

	.post-grid .post {
		animation-delay: 400ms;
	}

	@keyframes postRise {
		from {
			opacity: 0;
			filter: blur(8px);
			transform: translateY(22px);
		}
		to {
			opacity: 1;
			filter: blur(0);
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.blog-header,
		.post {
			animation: none;
		}
	}

	/* Shared link + media (cardless: rounded image, text beneath) */
	.post {
		display: block;
		text-decoration: none;
		color: inherit;
		outline-offset: 0.35rem;
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
		aspect-ratio: 1;
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
		max-width: 48rem;
		font-size: clamp(1.75rem, 3vw, 2.5rem);
		line-height: 1.1;
		margin-top: 1.5rem;
	}

	.post-title {
		font-size: clamp(1.0625rem, 1.4vw, 1.25rem);
		line-height: 1.28;
		margin-top: 0.9rem;
	}

	/* Meta (date only; no category field on posts) */
	.meta {
		margin-top: 0.75rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	/* Three editorial columns for the pinned lead and one for the story rail. */
	.featured-row {
		display: grid;
		grid-template-columns: minmax(0, 3fr) minmax(15rem, 1fr);
		align-items: start;
		gap: clamp(1.5rem, 2.5vw, 2rem);
		margin-bottom: clamp(5rem, 10vw, 8rem);
	}

	.lead {
		position: sticky;
		top: 4.5rem;
	}

	.side-column {
		display: flex;
		flex-direction: column;
		gap: clamp(2.5rem, 5vw, 4rem);
	}

	/* Remaining posts */
	.more-stories {
		padding-top: clamp(2rem, 4vw, 3rem);
		border-top: 1px solid var(--border-subtle);
	}

	.more-stories-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: clamp(2rem, 4vw, 3rem);
	}

	.more-stories-head h2 {
		margin: 0;
		font-size: clamp(1.75rem, 3vw, 2.5rem);
		font-weight: 500;
		line-height: 1.1;
		letter-spacing: -0.035em;
		color: var(--text-primary);
	}

	.post-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(18rem, 100%), 1fr));
		column-gap: clamp(1.5rem, 2.5vw, 2rem);
		row-gap: clamp(3rem, 6vw, 4.5rem);
	}

	@media (max-width: 960px) {
		.featured-row {
			grid-template-columns: 1fr;
			gap: 3.5rem;
		}

		.lead {
			position: static;
		}

		.side-column {
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 1.5rem;
		}
	}

	@media (max-width: 700px) {
		.blog-header {
			margin-bottom: 3rem;
		}

		.blog-header h1 {
			font-size: clamp(2.75rem, 14vw, 4rem);
		}

		.featured-row {
			gap: 3rem;
			margin-bottom: 4.5rem;
		}

		.side-column {
			grid-template-columns: 1fr;
			gap: 3rem;
		}

		.post-grid {
			grid-template-columns: 1fr;
			row-gap: 3rem;
		}
	}
</style>
