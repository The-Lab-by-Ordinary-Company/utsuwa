<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import DocsPrevNext from '$lib/components/docs/DocsPrevNext.svelte';
	import { DOCS_URL } from '$lib/config/site';
	import { docsNav } from '$lib/config/docs-nav';
	import { localPath } from '$lib/config/links';
	import { addCodeCopyButtons } from '$lib/utils/add-code-copy-buttons';
	import { browser } from '$app/environment';
	import '$lib/styles/prose.css';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let copied = $state(false);
	let articleEl = $state<HTMLElement | null>(null);
	let toc = $state<Array<{ id: string; text: string; level: number }>>([]);
	let activeId = $state('');

	// Which nav section does this page live under? (for the breadcrumb)
	const section = $derived(docsNav.find((s) => s.items.some((i) => i.slug === data.slug)));

	async function copyPage() {
		const article = document.querySelector('.docs-content') as HTMLElement | null;
		if (!article) return;
		await navigator.clipboard.writeText(article.innerText);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function scrollToHeading(e: MouseEvent, id: string) {
		e.preventDefault();
		const el = document.getElementById(id);
		if (!el) return;
		el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		history.replaceState(null, '', `#${id}`);
		activeId = id;
	}

	// Rebuild the on-page table of contents whenever the doc changes.
	$effect(() => {
		void data.content;
		if (!browser || !articleEl) return;

		let observer: IntersectionObserver | null = null;
		const raf = requestAnimationFrame(() => {
			addCodeCopyButtons('.docs-content');

			const headings = Array.from(
				articleEl!.querySelectorAll<HTMLElement>('h2[id], h3[id]')
			);
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
	<title>{data.metadata?.title || 'Docs'} - Utsuwa</title>
	{#if data.metadata?.description}
		<meta name="description" content={data.metadata.description} />
	{/if}
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.metadata?.title || 'Docs'} />
	{#if data.metadata?.description}
		<meta property="og:description" content={data.metadata.description} />
	{/if}
	<meta property="og:url" content={`${DOCS_URL}/${data.slug}`} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={data.metadata?.title || 'Docs'} />
	{#if data.metadata?.description}
		<meta name="twitter:description" content={data.metadata.description} />
	{/if}
	<link rel="canonical" href={`${DOCS_URL}/${data.slug}`} />
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'TechArticle',
		headline: data.metadata?.title,
		description: data.metadata?.description,
		url: `${DOCS_URL}/${data.slug}`,
		publisher: {
			'@type': 'Organization',
			name: 'Utsuwa',
			url: '${SITE_URL}'
		}
	})}</script>`}
	{@html '<style>html { scroll-padding-top: 6rem; }</style>'}
</svelte:head>

<div class="doc-wrap">
	<div class="doc-main">
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<a href={localPath('docs')}>Docs</a>
			{#if section}
				<Icon name="chevron-right" size={12} />
				<span class="crumb-section">{section.title}</span>
			{/if}
			<Icon name="chevron-right" size={12} />
			<span class="crumb-current">{data.metadata?.title || 'Page'}</span>
		</nav>

		<article class="docs-content prose" bind:this={articleEl}>
			<div class="page-toolbar">
				<button type="button" class="copy-page-btn" onclick={copyPage} title="Copy page content">
					<Icon name={copied ? 'check' : 'copy'} size={14} />
					<span>{copied ? 'Copied' : 'Copy page'}</span>
				</button>
			</div>
			<data.content />
			<DocsPrevNext slug={data.slug} />
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
	.doc-wrap {
		display: flex;
		gap: 2.5rem;
		max-width: 70rem;
		margin: 0 auto;
		padding: 1.75rem 3rem 2rem;
		align-items: flex-start;
	}

	.doc-main {
		flex: 1;
		min-width: 0;
		max-width: 48rem;
	}

	.docs-content {
		max-width: none;
		margin: 0;
		padding: 0;
	}

	.docs-content :global(h2),
	.docs-content :global(h3) {
		scroll-margin-top: 1.25rem;
	}

	/* Breadcrumb */
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.78rem;
		font-weight: 500;
		color: var(--docs-text-muted);
		margin-bottom: 1.25rem;
	}

	.breadcrumb a {
		color: var(--docs-text-muted);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.breadcrumb a:hover {
		color: var(--docs-accent);
	}

	.crumb-current {
		color: var(--docs-text);
		font-weight: 600;
	}

	.breadcrumb :global(svg) {
		opacity: 0.5;
	}

	.page-toolbar {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 0.5rem;
	}

	.copy-page-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.4rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--docs-text-muted);
		background: var(--docs-surface);
		border: 1px solid var(--docs-border);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 2px 4px rgba(0, 0, 0, 0.06);
	}

	.copy-page-btn:hover {
		color: var(--docs-accent);
		background: var(--docs-surface-solid);
		border-color: var(--docs-accent);
		transform: translateY(-1px);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 0 12px var(--docs-glow),
			0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.copy-page-btn:active {
		transform: translateY(0);
		box-shadow:
			0 1px 2px var(--docs-inner-shadow) inset,
			0 0 6px var(--docs-glow);
	}

	/* On-page table of contents */
	.toc {
		position: sticky;
		top: 1.5rem;
		width: 14rem;
		flex-shrink: 0;
		max-height: calc(100vh - 6rem);
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

		.doc-wrap {
			max-width: 52rem;
		}
	}

	@media (max-width: 768px) {
		.doc-wrap {
			padding: 1.5rem 1rem;
		}
	}
</style>
