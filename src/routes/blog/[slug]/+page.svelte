<script lang="ts">
	import '$lib/styles/prose.css';
	import { formatDate } from '$lib/utils/format-date';
	import { SITE_URL } from '$lib/config/site';
	import { addCodeCopyButtons } from '$lib/utils/add-code-copy-buttons';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	$effect(() => {
		void data.content;
		addCodeCopyButtons('.blog-post');
	});
</script>

<svelte:head>
	<title>{data.metadata?.title || 'Blog'} - Utsuwa</title>
	{#if data.metadata?.description}
		<meta name="description" content={data.metadata.description} />
	{/if}
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.metadata?.title || 'Blog'} />
	{#if data.metadata?.description}
		<meta property="og:description" content={data.metadata.description} />
	{/if}
	<meta property="og:image" content={data.metadata?.image ? `${SITE_URL}${data.metadata.image}` : `${SITE_URL}/brand-assets/thumbnail.png`} />
	<meta property="og:url" content={`${SITE_URL}/blog/${data.slug}`} />
	<meta property="og:site_name" content="Utsuwa" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.metadata?.title || 'Blog'} />
	{#if data.metadata?.description}
		<meta name="twitter:description" content={data.metadata.description} />
	{/if}
	<meta name="twitter:image" content={data.metadata?.image ? `${SITE_URL}${data.metadata.image}` : `${SITE_URL}/brand-assets/thumbnail.png`} />
	<link rel="canonical" href={`${SITE_URL}/blog/${data.slug}`} />
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: data.metadata?.title,
		description: data.metadata?.description,
		image: data.metadata?.image ? `${SITE_URL}${data.metadata.image}` : `${SITE_URL}/brand-assets/thumbnail.png`,
		datePublished: data.metadata?.date,
		url: `${SITE_URL}/blog/${data.slug}`,
		author: {
			'@type': 'Organization',
			name: 'Utsuwa',
			url: SITE_URL
		},
		publisher: {
			'@type': 'Organization',
			name: 'Utsuwa',
			url: SITE_URL
		}
	})}</script>`}
	{@html '<style>html { scroll-padding-top: 6rem; }</style>'}
</svelte:head>

<div class="blog-post-wrapper">
	<a href="/blog" class="back-link">
		<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
		<span>Back to Blog</span>
	</a>

	{#if data.metadata?.image}
		<div class="blog-banner">
			<img src={data.metadata.image} alt="" />
		</div>
	{/if}

	<article class="blog-post prose">
		<div class="blog-post-meta">
			{#if data.metadata?.date}
				<time class="blog-post-date" datetime={String(data.metadata.date)}
					>{formatDate(data.metadata.date)}</time
				>
			{/if}
			<span class="blog-post-author">Charles J. (CJ) Dyas</span>
		</div>
		<data.content />
	</article>
</div>

<style>
	.blog-post-wrapper {
		max-width: 48rem;
		margin: 0 auto;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: rgba(0, 0, 0, 0.5);
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 0.625rem;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		margin-bottom: 1.25rem;
		background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
		border: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.8),
			0 2px 4px rgba(0, 0, 0, 0.06);
	}

	.back-link:hover {
		color: #01B2FF;
		border-color: rgba(1, 178, 255, 0.3);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			0 0 12px rgba(1, 178, 255, 0.12),
			0 2px 8px rgba(0, 0, 0, 0.08);
		transform: translateY(-1px);
	}

	.back-link:active {
		transform: translateY(0);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.06),
			0 0 8px rgba(1, 178, 255, 0.08);
	}

	.blog-banner {
		border-radius: 1rem;
		overflow: hidden;
		margin-bottom: 2rem;
		border: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.8),
			0 4px 16px rgba(0, 0, 0, 0.08);
	}

	.blog-banner img {
		width: 100%;
		display: block;
		aspect-ratio: 16 / 9;
		object-fit: cover;
	}

	.blog-post-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.blog-post-date {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #01B2FF;
	}

	.blog-post-meta .blog-post-date::after {
		content: '\00b7';
		margin-left: 0.5rem;
		color: rgba(0, 0, 0, 0.25);
	}

	.blog-post-author {
		font-size: 0.8125rem;
		font-weight: 500;
		color: rgba(0, 0, 0, 0.5);
	}
</style>
