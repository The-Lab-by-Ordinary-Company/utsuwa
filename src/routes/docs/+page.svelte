<script lang="ts">
	import DocsHero from '$lib/components/docs/DocsHero.svelte';
	import DocsGetStartedCards from '$lib/components/docs/DocsGetStartedCards.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { docsNav } from '$lib/config/docs-nav';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(dateStr: string): string {
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	const sectionDescriptions: Record<string, string> = {
		'Overview': 'What Utsuwa is and how it works',
		'Guides': 'Setup instructions for web and desktop',
		'Technology': 'Architecture, companion system, memory',
		'Community': 'Contributing and resources'
	};
</script>

<svelte:head>
	<title>Documentation - Utsuwa</title>
	<meta name="description" content="Utsuwa documentation - guides, setup instructions, and contribution guidelines." />
</svelte:head>

<DocsHero />

<!-- Get Started -->
<section class="section">
	<div class="section-inner">
		<h2 class="section-heading">Get Started</h2>
		<DocsGetStartedCards />
	</div>
</section>

<!-- Explore the Docs -->
<section class="section section-alt">
	<div class="section-inner">
		<h2 class="section-heading">Explore the Docs</h2>
		<div class="explore-grid">
			{#each docsNav as section}
				<div class="explore-card">
					<div class="explore-header">
						<div class="explore-icon">
							<Icon name={section.icon} size={18} />
						</div>
						<h3 class="explore-title">{section.title}</h3>
					</div>
					<p class="explore-desc">{sectionDescriptions[section.title] ?? ''}</p>
					<ul class="explore-links">
						{#each section.items as item}
							<li><a href="/docs/{item.slug}">{item.title}</a></li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Latest News -->
{#if data.latestPost}
	<section class="section">
		<div class="section-inner">
			<h2 class="section-heading">Latest News</h2>
			<a href="/blog/{data.latestPost.slug}" class="blog-card">
				<div class="card-image">
					<img src={data.latestPost.image} alt="" loading="lazy" />
				</div>
				<div class="card-body">
					<time datetime={data.latestPost.date}>{formatDate(data.latestPost.date)}</time>
					<h3>{data.latestPost.title}</h3>
					<p>{data.latestPost.description}</p>
				</div>
			</a>
			<div class="view-all">
				<a href="/blog">View all posts &rarr;</a>
			</div>
		</div>
	</section>
{/if}

<!-- Open Source CTA -->
<section class="section section-alt cta-section">
	<div class="section-inner cta-inner">
		<p class="cta-text">
			Utsuwa is open source.
			<a href="https://github.com/charlesdyas/utsuwa" target="_blank" rel="noopener noreferrer">Star us on GitHub</a>
			or read the <a href="/docs/community/contributing">Contributing Guide</a>.
		</p>
	</div>
</section>

<style>
	/* Shared section styles */
	.section {
		padding: 3rem 2rem 4rem;
		border-bottom: 1px solid var(--docs-border);
	}

	.section-alt {
		background: var(--docs-surface);
	}

	.section-inner {
		max-width: 800px;
		margin: 0 auto;
	}

	.section-heading {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--docs-text);
		margin: 0 0 1.25rem;
	}

	/* Explore the Docs */
	.explore-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.25rem;
	}

	.explore-card {
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

	.explore-card:hover {
		border-color: var(--docs-accent);
		transform: translateY(-4px);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 0 20px var(--docs-glow),
			0 8px 32px rgba(0, 0, 0, 0.12);
	}

	.explore-header {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		margin-bottom: 0.5rem;
	}

	.explore-icon {
		color: var(--docs-accent);
		display: flex;
		align-items: center;
	}

	.explore-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--docs-text);
		margin: 0;
	}

	.explore-desc {
		font-size: 0.8125rem;
		color: var(--docs-text-muted);
		margin: 0 0 0.75rem;
		line-height: 1.5;
	}

	.explore-links {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.explore-links a {
		font-size: 0.8125rem;
		color: var(--docs-text-muted);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.explore-links a:hover {
		color: var(--docs-accent);
	}

	/* Blog card (matches blog listing) */
	.blog-card {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		border-radius: 1rem;
		overflow: hidden;
		border: 1px solid var(--docs-glass-border);
		background: var(--docs-glass-bg);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 4px 16px rgba(0, 0, 0, 0.08);
	}

	.blog-card:hover {
		border-color: var(--docs-accent);
		transform: translateY(-4px);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 0 24px var(--docs-glow),
			0 12px 40px rgba(0, 0, 0, 0.15);
	}

	.card-image {
		position: relative;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: var(--docs-surface);
	}

	.card-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.blog-card:hover .card-image img {
		transform: scale(1.03);
	}

	.card-body {
		padding: 1.25rem 1.5rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.card-body time {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--docs-text-muted);
	}

	.card-body h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--docs-text);
		margin: 0;
		transition: color 0.15s ease;
		line-height: 1.4;
	}

	.blog-card:hover .card-body h3 {
		color: var(--docs-accent);
	}

	.card-body p {
		font-size: 0.8125rem;
		color: var(--docs-text-muted);
		line-height: 1.6;
		margin: 0;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.view-all {
		margin-top: 1rem;
		text-align: right;
	}

	.view-all a {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--docs-text-muted);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.view-all a:hover {
		color: var(--docs-accent);
	}

	/* Open Source CTA */
	.cta-section {
		padding: 2rem 2rem 3rem;
	}

	.cta-inner {
		text-align: center;
	}

	.cta-text {
		font-size: 0.875rem;
		color: var(--docs-text-muted);
		margin: 0;
	}

	.cta-text a {
		color: var(--docs-accent);
		text-decoration: none;
		font-weight: 600;
	}

	.cta-text a:hover {
		text-decoration: underline;
	}

	@media (max-width: 640px) {
		.explore-grid {
			grid-template-columns: 1fr;
		}

		.section {
			padding: 2.5rem 1.25rem 3rem;
		}
	}
</style>
