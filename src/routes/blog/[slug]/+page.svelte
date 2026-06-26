<script lang="ts">
	import '$lib/styles/prose.css';
	import { formatDate } from '$lib/utils/format-date';
	import { SITE_URL } from '$lib/config/site';
	import { addCodeCopyButtons } from '$lib/utils/add-code-copy-buttons';
	import { browser } from '$app/environment';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let articleEl = $state<HTMLElement | null>(null);
	let toc = $state<Array<{ id: string; text: string; level: number }>>([]);
	let activeId = $state('');

	function scrollToHeading(e: MouseEvent, id: string) {
		e.preventDefault();
		const el = document.getElementById(id);
		if (!el) return;
		el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		history.replaceState(null, '', `#${id}`);
		activeId = id;
	}

	// Build the "On this page" list from the post's headings and scroll-spy them.
	$effect(() => {
		void data.content;
		if (!browser || !articleEl) return;

		let observer: IntersectionObserver | null = null;
		const raf = requestAnimationFrame(() => {
			addCodeCopyButtons('.blog-post');

			const headings = Array.from(articleEl!.querySelectorAll<HTMLElement>('h2[id], h3[id]'));
			toc = headings.map((h) => ({
				id: h.id,
				text: h.textContent ?? '',
				level: h.tagName === 'H3' ? 3 : 2
			}));
			activeId = headings[0]?.id ?? '';

			if (!headings.length) return;
			observer = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting) activeId = (entry.target as HTMLElement).id;
					}
				},
				{ rootMargin: '0px 0px -75% 0px', threshold: 0 }
			);
			headings.forEach((h) => observer!.observe(h));
		});

		return () => {
			cancelAnimationFrame(raf);
			observer?.disconnect();
		};
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

<div class="blog-post-layout">
	<div class="blog-post-main">
		<a href="/blog" class="back-link">
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
			<span>Back to Blog</span>
		</a>

		{#if data.metadata?.image}
			<div class="blog-banner">
				<img src={data.metadata.image} alt="" />
			</div>
		{/if}

		<article class="blog-post prose" bind:this={articleEl}>
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

	{#if toc.length}
		<aside class="toc" aria-label="On this page">
			<p class="toc-title">On this page</p>
			<ul class="toc-list">
				{#each toc as heading}
					<li class:sub={heading.level === 3}>
						<a
							href={`#${heading.id}`}
							class:active={activeId === heading.id}
							onclick={(e) => scrollToHeading(e, heading.id)}
						>
							{heading.text}
						</a>
					</li>
				{/each}
			</ul>
		</aside>
	{/if}
</div>

<style>
	.blog-post-layout {
		display: flex;
		gap: 3rem;
		justify-content: center;
		align-items: flex-start;
	}

	.blog-post-main {
		width: 100%;
		max-width: 46rem;
		min-width: 0;
	}

	/* On-page table of contents */
	.toc {
		position: sticky;
		top: 1.5rem;
		width: 14rem;
		flex-shrink: 0;
		max-height: calc(100vh - 4rem);
		overflow-y: auto;
		padding-top: 0.25rem;
	}

	.toc-title {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--docs-text-muted);
		margin: 0 0 0.75rem;
		padding-left: 0.85rem;
	}

	.toc-list {
		list-style: none;
		margin: 0;
		padding: 0;
		border-left: 1px solid var(--docs-border);
	}

	.toc-list li.sub a {
		padding-left: 1.75rem;
		font-size: 0.78rem;
	}

	.toc-list a {
		display: block;
		padding: 0.32rem 0.85rem;
		margin-left: -1px;
		border-left: 2px solid transparent;
		font-size: 0.82rem;
		line-height: 1.4;
		color: var(--docs-text-muted);
		text-decoration: none;
		transition: color 0.15s ease, border-color 0.15s ease;
	}

	.toc-list a:hover {
		color: var(--docs-text);
	}

	.toc-list a.active {
		color: var(--docs-accent);
		border-left-color: var(--docs-accent);
		font-weight: 600;
	}

	@media (max-width: 1100px) {
		.toc {
			display: none;
		}
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--docs-text-muted);
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 0.625rem;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		margin-bottom: 1.25rem;
		background: var(--docs-surface);
		border: 1px solid var(--docs-border);
		box-shadow:
			inset 0 1px 0 var(--docs-inner-highlight),
			0 2px 4px rgba(0, 0, 0, 0.06);
	}

	.back-link:hover {
		color: var(--docs-accent);
		border-color: var(--docs-accent);
		background: var(--docs-surface-solid);
		box-shadow:
			inset 0 1px 0 var(--docs-inner-highlight),
			0 0 12px var(--docs-glow),
			0 2px 8px rgba(0, 0, 0, 0.08);
		transform: translateY(-1px);
	}

	.back-link:active {
		transform: translateY(0);
		box-shadow:
			inset 0 2px 4px var(--docs-inner-shadow),
			0 0 8px var(--docs-glow);
	}

	.blog-banner {
		border-radius: 1rem;
		overflow: hidden;
		margin-bottom: 2rem;
		border: 1px solid var(--docs-glass-border);
		box-shadow:
			inset 0 1px 0 var(--docs-inner-highlight),
			0 4px 16px rgba(0, 0, 0, 0.12);
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
		color: var(--docs-accent);
	}

	.blog-post-meta .blog-post-date::after {
		content: '\00b7';
		margin-left: 0.5rem;
		color: var(--docs-text-muted);
		opacity: 0.6;
	}

	.blog-post-author {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--docs-text-muted);
	}
</style>
