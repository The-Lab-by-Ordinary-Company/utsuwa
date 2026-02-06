<script lang="ts">
	import { tick } from 'svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import '$lib/styles/prose.css';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 448 512" fill="currentColor"><path d="M208 0H332.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9V336c0 26.5-21.5 48-48 48H208c-26.5 0-48-21.5-48-48V48c0-26.5 21.5-48 48-48zM48 128h80v64H64V448H256V416h64v48c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V176c0-26.5 21.5-48 48-48z"/></svg>`;
	const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 448 512" fill="currentColor"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>`;

	function formatDate(raw: string | Date): string {
		const d = raw instanceof Date ? raw : new Date(raw + 'T00:00:00');
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	$effect(() => {
		void data.content;
		tick().then(() => {
			const pres = document.querySelectorAll('.blog-post pre');
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
	<title>{data.metadata?.title || 'Blog'} - Utsuwa</title>
	{#if data.metadata?.description}
		<meta name="description" content={data.metadata.description} />
	{/if}
	{@html '<style>html { scroll-padding-top: 6rem; }</style>'}
</svelte:head>

<div class="blog-post-wrapper">
	<a href="/blog" class="back-link">
		<Icon name="chevron-left" size={14} />
		<span>Back to Blog</span>
	</a>

	{#if data.metadata?.image}
		<div class="blog-banner">
			<img src={data.metadata.image} alt="" />
		</div>
	{/if}

	<article class="blog-post prose">
		{#if data.metadata?.date}
			<time class="blog-post-date" datetime={data.metadata.date instanceof Date ? data.metadata.date.toISOString().split('T')[0] : data.metadata.date}
				>{formatDate(data.metadata.date)}</time
			>
		{/if}
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
		color: var(--docs-text-muted);
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 0.625rem;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
		margin-bottom: 1.25rem;
		background: var(--docs-surface);
		border: 1px solid var(--docs-border);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 -1px 1px var(--docs-inner-shadow) inset,
			0 2px 4px rgba(0, 0, 0, 0.06);
	}

	.back-link:hover {
		color: var(--docs-accent);
		background: var(--docs-surface-solid);
		border-color: var(--docs-accent);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 -1px 1px var(--docs-inner-shadow) inset,
			0 0 12px var(--docs-glow),
			0 2px 8px rgba(0, 0, 0, 0.08);
		transform: translateY(-1px);
	}

	.back-link:active {
		transform: translateY(0);
		box-shadow:
			0 1px 3px var(--docs-inner-shadow) inset,
			0 0 8px var(--docs-glow);
	}

	.blog-banner {
		border-radius: 1rem;
		overflow: hidden;
		margin-bottom: 2rem;
		border: 1px solid var(--docs-glass-border);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 4px 16px rgba(0, 0, 0, 0.08);
	}

	.blog-banner img {
		width: 100%;
		display: block;
		aspect-ratio: 16 / 9;
		object-fit: cover;
	}

	.blog-post-date {
		display: block;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--docs-accent);
		margin-bottom: 0.5rem;
	}
</style>
