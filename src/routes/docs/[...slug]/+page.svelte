<script lang="ts">
	import { tick } from 'svelte';
	import DocsTableOfContents from '$lib/components/docs/DocsTableOfContents.svelte';
	import DocsMobileToc from '$lib/components/docs/DocsMobileToc.svelte';
	import DocsBreadcrumbs from '$lib/components/docs/DocsBreadcrumbs.svelte';
	import DocsPrevNext from '$lib/components/docs/DocsPrevNext.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 448 512" fill="currentColor"><path d="M208 0H332.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9V336c0 26.5-21.5 48-48 48H208c-26.5 0-48-21.5-48-48V48c0-26.5 21.5-48 48-48zM48 128h80v64H64V448H256V416h64v48c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V176c0-26.5 21.5-48 48-48z"/></svg>`;
	const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 448 512" fill="currentColor"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>`;

	$effect(() => {
		void data.content;
		tick().then(() => {
			const pres = document.querySelectorAll('.docs-content pre');
			pres.forEach((pre) => {
				if (pre.querySelector('.copy-btn')) return;

				const btn = document.createElement('button');
				btn.className = 'copy-btn';
				btn.innerHTML = copyIcon;
				btn.title = 'Copy code';
				btn.onclick = async () => {
					const code = pre.querySelector('code')?.textContent || pre.textContent || '';
					await navigator.clipboard.writeText(code);
					btn.innerHTML = checkIcon;
					setTimeout(() => (btn.innerHTML = copyIcon), 2000);
				};
				pre.appendChild(btn);
			});
		});
	});
</script>

<svelte:head>
	<title>{data.metadata?.title || 'Docs'} - Utsuwa</title>
	{#if data.metadata?.description}
		<meta name="description" content={data.metadata.description} />
	{/if}
	{@html '<style>html { scroll-padding-top: 6rem; }</style>'}
</svelte:head>

<div class="doc-page">
	<article class="docs-content prose">
		<DocsBreadcrumbs slug={data.slug} />
		<data.content />
		<DocsPrevNext slug={data.slug} />
	</article>
	<DocsTableOfContents contentKey={data.content} slug={data.slug} />
</div>
<DocsMobileToc contentKey={data.content} />

<style>
	.doc-page {
		display: flex;
	}

	.docs-content {
		flex: 1;
		min-width: 0;
		padding: 2rem 3rem;
	}

	:global(.docs .prose) {
		color: var(--docs-text);
		line-height: 1.75;
	}

	:global(.docs .prose h1) {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		color: var(--docs-text);

	}

	:global(.docs .prose h2) {
		font-size: 1.5rem;
		font-weight: 600;
		margin-top: 2.5rem;
		margin-bottom: 0.75rem;
		color: var(--docs-text);

	}

	:global(.docs .prose h3) {
		font-size: 1.125rem;
		font-weight: 600;
		margin-top: 2rem;
		margin-bottom: 0.5rem;
		color: var(--docs-text);

	}

	:global(.docs .prose p) {
		margin-bottom: 1rem;
		color: var(--docs-text);
	}

	:global(.docs .prose a) {
		color: var(--docs-accent);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	:global(.docs .prose a:hover) {
		color: var(--docs-accent-hover);
	}

	:global(.docs .prose code) {
		background: var(--docs-code-bg);
		padding: 0.15rem 0.35rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
	}

	:global(.docs .prose pre) {
		background: var(--docs-code-bg);
		padding: 1rem 1.25rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin: 1.5rem 0;
		position: relative;
	}

	:global(.copy-btn) {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.375rem;
		background: var(--docs-surface);
		border: 1px solid var(--docs-border);
		border-radius: 0.25rem;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.15s, background 0.15s;
		color: var(--docs-text-muted);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.docs .prose pre:hover .copy-btn) {
		opacity: 1;
	}

	:global(.copy-btn:hover) {
		background: var(--docs-border);
		color: var(--docs-text);
	}

	:global(.docs .prose pre code) {
		background: none;
		padding: 0;
	}

	/* Shiki dual theme support - use docs theme bg, Shiki colors for syntax */
	:global(.shiki) {
		background-color: var(--docs-code-bg) !important;
	}

	:global(.shiki span) {
		background-color: transparent !important;
	}

	/* Dark mode: override inline color with --shiki-dark variable */
	:global([data-docs-theme='dark'] .shiki span) {
		color: var(--shiki-dark) !important;
	}

	/* System dark mode when no explicit theme is set */
	@media (prefers-color-scheme: dark) {
		:global(html:not([data-docs-theme='light']) .shiki span) {
			color: var(--shiki-dark) !important;
		}
	}

	:global(.docs .prose ul),
	:global(.docs .prose ol) {
		padding-left: 1.5rem;
		margin-bottom: 1rem;
	}

	:global(.docs .prose ul) {
		list-style: none;
	}

	:global(.docs .prose ul > li::before) {
		content: '\2022';
		color: var(--docs-accent);
		font-weight: 700;
		display: inline-block;
		width: 1em;
		margin-left: -1em;
	}

	:global(.docs .prose ol) {
		list-style: none;
		counter-reset: ol-counter;
	}

	:global(.docs .prose ol > li) {
		counter-increment: ol-counter;
	}

	:global(.docs .prose ol > li::before) {
		content: counter(ol-counter) '.';
		color: var(--docs-accent);
		font-weight: 700;
		display: inline-block;
		width: 1.5em;
		margin-left: -1.5em;
	}

	:global(.docs .prose li) {
		margin-bottom: 0.375rem;
	}

	:global(.docs .prose img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		border: 1px solid var(--docs-border);
		margin: 1rem 0;
	}

	:global(.docs .prose blockquote) {
		border-left: 3px solid var(--docs-border);
		padding-left: 1rem;
		color: var(--docs-text-muted);
		margin: 1.5rem 0;
	}

	:global(.docs .prose hr) {
		border: none;
		border-top: 1px solid var(--docs-border);
		margin: 2rem 0;
	}

	:global(.docs .prose table) {
		display: block;
		width: 100%;
		overflow-x: auto;
		border-collapse: collapse;
		margin: 1.5rem 0;
		white-space: nowrap;
	}

	:global(.docs .prose th),
	:global(.docs .prose td) {
		text-align: left;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--docs-border);
		font-size: 0.8125rem;
	}

	:global(.docs .prose th) {
		font-weight: 600;
	}

	@media (max-width: 768px) {
		.docs-content {
			padding: 1.5rem 1rem;
		}
	}
</style>
