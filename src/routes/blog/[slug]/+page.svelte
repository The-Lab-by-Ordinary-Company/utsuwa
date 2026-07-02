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
	<a href="/blog" class="btn btn-secondary back-link">
		<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
		<span>Back to Blog</span>
	</a>

	<header class="blog-post-header">
		<div class="post-meta">
			{#if data.metadata?.date}
				<time class="post-date" datetime={String(data.metadata.date)}>{formatDate(data.metadata.date)}</time>
			{/if}
			{#if data.metadata?.tag}
				<span class="post-tag">{data.metadata.tag}</span>
			{/if}
			<span class="post-author">Charles J. (CJ) Dyas</span>
		</div>

		{#if data.metadata?.title}
			<h1 class="post-title">{data.metadata.title}</h1>
		{/if}

		{#if data.metadata?.description}
			<p class="post-subhead">{data.metadata.description}</p>
		{/if}
	</header>

	{#if data.metadata?.image}
		<div class="blog-banner">
			<img src={data.metadata.image} alt="" />
		</div>
	{/if}

	<div class="blog-post-body" class:no-toc={!toc.length}>
		{#if toc.length}
			<aside class="toc" aria-label="Table of contents">
				<p class="toc-title">Table of contents</p>
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

		<article class="blog-post prose" bind:this={articleEl}>
			<data.content />
		</article>
	</div>
</div>

<style>
	.blog-post-layout {
		width: 100%;
	}

	.back-link {
		margin-bottom: 2rem;
	}

	/* Centered header: meta line, title, subhead */
	.blog-post-header {
		text-align: center;
		max-width: 46rem;
		margin: 0 auto 3.5rem;
	}

	.post-meta {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary);
		margin: 0 0 1.5rem;
	}

	/* Middot between whichever meta items are present */
	.post-meta > * + *::before {
		content: '·';
		margin-right: 0.5rem;
		color: var(--text-tertiary);
	}

	.post-title {
		font-size: clamp(2.25rem, 5vw, 3.25rem);
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: -0.02em;
		color: var(--text-primary);
		margin: 0 0 1.25rem;
	}

	.post-subhead {
		max-width: 34rem;
		margin: 0 auto;
		font-size: 1.125rem;
		line-height: 1.55;
		color: var(--text-secondary);
	}

	/* Full-width hero */
	.blog-banner {
		border-radius: var(--radius-xl);
		overflow: hidden;
		margin: 0 0 3.5rem;
		box-shadow: var(--shadow-md);
	}

	.blog-banner img {
		width: 100%;
		display: block;
		aspect-ratio: 16 / 9;
		object-fit: cover;
	}

	/* Body: table of contents on the left, reading column on the right */
	.blog-post-body {
		display: grid;
		grid-template-columns: 14rem minmax(0, 1fr);
		gap: 3rem;
		align-items: start;
	}

	.blog-post-body.no-toc {
		grid-template-columns: 1fr;
	}

	.blog-post {
		max-width: 46rem;
		margin: 0 auto;
		min-width: 0;
	}

	/* Title now lives in the header, so drop the duplicate from the body */
	.blog-post :global(h1:first-child) {
		display: none;
	}

	/* One-shot load-in: header, banner, then body. The article itself never
	   animates on scroll — reading stays static. */
	.back-link,
	.blog-post-header {
		animation: postEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	.blog-banner {
		animation: postEnter 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
	}

	.blog-post-body {
		animation: postEnter 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.18s both;
	}

	@keyframes postEnter {
		from {
			opacity: 0;
			filter: blur(8px);
			transform: translateY(18px);
		}
		to {
			opacity: 1;
			filter: none;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.back-link,
		.blog-post-header,
		.blog-banner,
		.blog-post-body {
			animation: none;
		}
	}

	/* Table of contents. Sticky offset clears the site nav (~3.5rem tall). */
	.toc {
		position: sticky;
		top: 5.5rem;
		align-self: start;
		max-height: calc(100vh - 7rem);
		overflow-y: auto;
	}

	.toc-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin: 0 0 0.75rem;
		padding-left: 0.75rem;
	}

	.toc-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.toc-list a {
		display: block;
		padding: 0.4rem 0.75rem;
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
		line-height: 1.4;
		color: var(--text-secondary);
		text-decoration: none;
		transition: color 0.15s ease, background 0.15s ease;
	}

	.toc-list li.sub a {
		padding-left: 1.5rem;
		font-size: 0.78rem;
	}

	.toc-list a:hover {
		color: var(--text-primary);
	}

	.toc-list a.active {
		background: var(--bg-tertiary);
		color: var(--text-primary);
		font-weight: 500;
	}

	@media (max-width: 1100px) {
		.blog-post-body {
			grid-template-columns: 1fr;
		}

		.toc {
			display: none;
		}
	}
</style>
