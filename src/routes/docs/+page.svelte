<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import DocsSearch from '$lib/components/docs/DocsSearch.svelte';
	import DocsGetStartedCards from '$lib/components/docs/DocsGetStartedCards.svelte';
	import { DOCS_URL } from '$lib/config/site';
	import { localPath } from '$lib/config/links';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Documentation - Utsuwa</title>
	<meta
		name="description"
		content="Guides, setup, and architecture docs for Utsuwa — the open-source AI companion with 3D VRM avatars, voice, and semantic memory."
	/>
	<link rel="canonical" href={DOCS_URL} />
	<meta property="og:title" content="Utsuwa Documentation" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={DOCS_URL} />
</svelte:head>

<div class="docs-home" data-pagefind-ignore>
	<header class="home-hero">
		<div class="hero-bubbles" aria-hidden="true">
			<span class="doc-bubble" style="--size:70px;  --x:7%;  --y:20%; --dur:15s; --delay:-2s;"></span>
			<span class="doc-bubble" style="--size:120px; --x:84%; --y:14%; --dur:21s; --delay:-7s;"></span>
			<span class="doc-bubble" style="--size:40px;  --x:70%; --y:62%; --dur:12s; --delay:-4s;"></span>
			<span class="doc-bubble" style="--size:54px;  --x:18%; --y:70%; --dur:17s; --delay:-9s;"></span>
		</div>
		<p class="eyebrow">Documentation</p>
		<h1 class="home-title">Everything you need to run your vessel.</h1>
		<p class="home-lead">
			Guides, setup walkthroughs, and a look under the hood. Search the docs or jump straight to a
			section below.
		</p>
		<div class="home-search">
			<DocsSearch id="docs-home-search" />
		</div>
	</header>

	<section class="home-section">
		<h2 class="section-heading">Get started</h2>
		<DocsGetStartedCards />
	</section>

	<section class="home-section">
		<h2 class="section-heading">Browse the docs</h2>
		<div class="section-grid">
			{#each data.sections as section}
				<div class="section-panel">
					<div class="panel-head">
						<div class="panel-icon">
							<Icon name={section.icon} size={18} />
							<div class="panel-icon-shine"></div>
						</div>
						<h3 class="panel-title">{section.title}</h3>
					</div>
					<ul class="panel-list">
						{#each section.items as item}
							<li>
								<a href={localPath('docs', `/${item.slug}`)} class="panel-link">
									<span class="link-title">
										{item.title}
										<Icon name="arrow-right" size={13} />
									</span>
									{#if item.description}
										<span class="link-desc">{item.description}</span>
									{/if}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</section>
</div>

<style>
	.docs-home {
		max-width: 60rem;
		margin: 0 auto;
		padding: 3rem 2.5rem 4rem;
	}

	/* Hero */
	.home-hero {
		position: relative;
		text-align: center;
		margin-bottom: 3.5rem;
		padding-top: 1rem;
	}

	/* Keep hero content above the decorative bubbles */
	.home-hero > :not(.hero-bubbles) {
		position: relative;
		z-index: 1;
	}

	/* Frutiger Aero glass bubbles, clipped to the hero, behind content */
	.hero-bubbles {
		position: absolute;
		inset: -1rem 0 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 0;
	}

	.doc-bubble {
		position: absolute;
		left: var(--x);
		top: var(--y);
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		background:
			radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.2) 24%, transparent 46%),
			linear-gradient(180deg, rgba(120, 215, 255, 0.3) 0%, rgba(1, 178, 255, 0.12) 100%);
		box-shadow:
			inset 0 0 16px rgba(255, 255, 255, 0.4),
			inset 0 -5px 12px rgba(1, 130, 200, 0.22),
			0 6px 24px rgba(0, 120, 190, 0.12);
		opacity: 0.55;
		animation: docFloat var(--dur, 16s) ease-in-out var(--delay, 0s) infinite alternate;
		will-change: transform;
	}

	@keyframes docFloat {
		0% {
			transform: translateY(0) translateX(0) scale(1);
		}
		100% {
			transform: translateY(-30px) translateX(12px) scale(1.07);
		}
	}

	.eyebrow {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--docs-accent);
		margin: 0 0 0.85rem;
	}

	.home-title {
		font-family: 'Exo 2', sans-serif;
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 700;
		line-height: 1.05;
		letter-spacing: -0.01em;
		text-wrap: balance;
		margin: 0 0 1rem;
		background: linear-gradient(118deg, var(--docs-text) 38%, var(--docs-accent) 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		color: var(--docs-text);
	}

	.home-lead {
		font-size: 1.05rem;
		line-height: 1.6;
		color: var(--docs-text-muted);
		max-width: 34rem;
		margin: 0 auto 1.75rem;
		text-wrap: pretty;
	}

	.home-search {
		position: relative;
		max-width: 30rem;
		margin: 0 auto;
	}

	/* Soft glow halo behind the search box */
	.home-search::before {
		content: '';
		position: absolute;
		inset: -55% -12%;
		background: radial-gradient(50% 60% at 50% 50%, var(--docs-glow) 0%, transparent 70%);
		opacity: 0.7;
		pointer-events: none;
		z-index: 0;
	}

	.home-search :global(.search-container) {
		position: relative;
		z-index: 1;
	}

	/* Sections */
	.home-section {
		margin-top: 3rem;
	}

	.section-heading {
		font-family: 'Exo 2', sans-serif;
		font-size: 1.35rem;
		font-weight: 600;
		color: var(--docs-text);
		margin: 0 0 1.25rem;
	}

	.section-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.25rem;
	}

	.section-panel {
		border: 1px solid var(--docs-glass-border);
		border-radius: 1rem;
		padding: 1.5rem;
		background: var(--docs-glass-bg);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 4px 16px rgba(0, 0, 0, 0.08);
	}

	.section-panel:hover {
		border-color: var(--docs-accent);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 0 20px var(--docs-glow),
			0 8px 28px rgba(0, 0, 0, 0.1);
	}

	.panel-head {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.panel-icon {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.625rem;
		background: var(--docs-btn-gradient);
		color: white;
		box-shadow:
			0 2px 0 rgba(255, 255, 255, 0.35) inset,
			0 -1px 2px rgba(0, 0, 0, 0.1) inset,
			0 4px 12px var(--docs-glow);
		border: 1px solid rgba(255, 255, 255, 0.15);
		flex-shrink: 0;
	}

	.panel-icon-shine {
		position: absolute;
		top: 2px;
		left: 15%;
		right: 15%;
		height: 40%;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.1) 60%, transparent 100%);
		border-radius: 0.4rem 0.4rem 50% 50%;
		pointer-events: none;
	}

	.panel-title {
		font-family: 'Exo 2', sans-serif;
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--docs-text);
		margin: 0;
	}

	.panel-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.panel-link {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.6rem 0.7rem;
		border-radius: 0.6rem;
		text-decoration: none;
		border: 1px solid transparent;
		transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.panel-link:hover {
		background: var(--docs-surface);
		border-color: var(--docs-border);
		box-shadow: 0 1px 0 var(--docs-inner-highlight) inset;
	}

	.link-title {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--docs-text);
	}

	.link-title :global(svg) {
		opacity: 0;
		transform: translateX(-4px);
		transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
		color: var(--docs-accent);
	}

	.panel-link:hover .link-title {
		color: var(--docs-accent);
	}

	.panel-link:hover .link-title :global(svg) {
		opacity: 1;
		transform: translateX(0);
	}

	.link-desc {
		font-size: 0.8rem;
		line-height: 1.45;
		color: var(--docs-text-muted);
	}

	@media (max-width: 768px) {
		.docs-home {
			padding: 2rem 1rem 3rem;
		}

		.section-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.doc-bubble {
			animation: none;
		}
	}
</style>
