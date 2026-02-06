<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(dateStr: string): string {
		return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Blog - Utsuwa</title>
	<meta
		name="description"
		content="Development updates and behind-the-scenes notes from building Utsuwa."
	/>
</svelte:head>

<div class="blog-index">
	<div class="blog-header">
		<h1>Blog</h1>
		<p class="blog-subtitle">Development updates and behind-the-scenes notes.</p>
	</div>

	<div class="blog-grid">
		{#each data.posts as post}
			<a href="/blog/{post.slug}" class="blog-card">
				<div class="card-image">
					<img src={post.image} alt="" loading="lazy" />
				</div>
				<div class="card-body">
					<time datetime={post.date}>{formatDate(post.date)}</time>
					<h2>{post.title}</h2>
					<p>{post.description}</p>
				</div>
			</a>
		{/each}
	</div>
</div>

<style>
	.blog-header {
		margin-bottom: 2.5rem;
	}

	.blog-header h1 {
		font-size: 2.25rem;
		font-weight: 700;
		color: var(--docs-text);
		margin-bottom: 0.5rem;
	}

	.blog-subtitle {
		color: var(--docs-text-muted);
		font-size: 1.125rem;
	}

	.blog-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
	}

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
		flex: 1;
	}

	.card-body time {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--docs-text-muted);
	}

	.card-body h2 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--docs-text);
		margin: 0;
		transition: color 0.15s ease;
		line-height: 1.4;
	}

	.blog-card:hover .card-body h2 {
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

	@media (max-width: 640px) {
		.blog-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
