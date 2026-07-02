<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { cycleTheme, getIconName, getLabel } from '$lib/config/docs-theme-toggle.svelte';
	import { sectionUrl, isSection } from '$lib/config/links';
	import { GITHUB_REPO } from '$lib/config/site';
	import { getSortedPosts } from '$lib/utils/blog-posts';
	import { formatDate } from '$lib/utils/format-date';

	// Newest posts for the Blog hover dropdown. blog-posts uses an eager glob, so
	// this resolves synchronously at build time and is safe to read during SSR.
	const recentPosts = getSortedPosts().slice(0, 4);

	const themeIcon = $derived(getIconName());
	const themeLabel = $derived(getLabel());

	const pathname = $derived(page.url.pathname);
	const onHome = $derived(pathname === '/');
	const onBlog = $derived(pathname.startsWith('/blog'));
</script>

<nav class="site-nav">
	<div class="site-nav-inner">
		<a href="/" class="site-nav-brand" aria-label="Utsuwa home">
			<img src="/brand-assets/logo.svg" alt="Utsuwa" class="site-nav-logo" />
		</a>

		<div class="site-nav-links">
			<a href="/#features" class="site-nav-link" class:active={onHome}>Features</a>
			<a href={sectionUrl('docs')} class="site-nav-link" class:active={isSection('docs')}>Docs</a>

			<!-- Blog + recent-posts dropdown. Reveal is pure hover/focus-within, no
			     click state; the Blog link itself still navigates to /blog. -->
			<div class="nav-item">
				<a href="/blog" class="site-nav-link" class:active={onBlog}>Blog</a>

				{#if recentPosts.length}
					<div class="nav-dropdown">
						<div class="nav-dropdown-card">
							{#each recentPosts as post (post.slug)}
								<a href="/blog/{post.slug}" class="nav-dropdown-row">
									<img class="nav-dropdown-thumb" src={post.image} alt="" loading="lazy" />
									<span class="nav-dropdown-text">
										<span class="nav-dropdown-title">{post.title}</span>
										<time class="nav-dropdown-date" datetime={post.date}>{formatDate(post.date)}</time>
									</span>
								</a>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" class="site-nav-link">GitHub</a>
		</div>

		<div class="site-nav-right">
			<button
				type="button"
				onclick={cycleTheme}
				class="site-nav-theme-btn"
				aria-label={`Theme: ${themeLabel}`}
				title={themeLabel}
			>
				<Icon name={themeIcon} size={16} />
			</button>
			<a href={sectionUrl('app')} class="btn btn-primary btn-sm">Try Live</a>
		</div>
	</div>
</nav>

<style>
	.site-nav {
		position: sticky;
		top: 0;
		z-index: 50;
		background: var(--bg-page);
		border-bottom: 1px solid var(--border-subtle);
	}

	.site-nav-inner {
		max-width: 80rem;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.9rem 1.5rem;
	}

	.site-nav-brand {
		display: inline-flex;
		align-items: center;
		text-decoration: none;
	}

	/* Logo reads black in light, natural (white) in dark */
	.site-nav-logo {
		height: 1.125rem;
		width: auto;
		filter: brightness(0);
		opacity: 0.85;
	}

	:global(.dark) .site-nav-logo {
		filter: none;
	}

	.site-nav-links {
		display: flex;
		align-items: center;
		gap: 1.75rem;
	}

	.site-nav-link {
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.site-nav-link:hover,
	.site-nav-link.active {
		color: var(--text-primary);
	}

	/* Blog item anchors the hover/focus dropdown */
	.nav-item {
		position: relative;
		display: inline-flex;
		align-items: center;
	}

	.nav-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		z-index: 60;
		/* Invisible bridge so moving the cursor from Blog down to the panel
		   keeps it open across the visual gap */
		padding-top: 0.75rem;
		opacity: 0;
		visibility: hidden;
		transform: translateY(-4px);
		pointer-events: none;
		transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s ease;
	}

	.nav-item:hover .nav-dropdown,
	.nav-item:focus-within .nav-dropdown {
		opacity: 1;
		visibility: visible;
		transform: none;
		pointer-events: auto;
	}

	.nav-dropdown-card {
		width: 20rem;
		max-width: calc(100vw - 2rem);
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.375rem;
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
	}

	.nav-dropdown-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: background 0.15s ease;
	}

	.nav-dropdown-row:hover {
		background: var(--bg-secondary);
	}

	.nav-dropdown-thumb {
		width: 3rem;
		height: 3rem;
		flex-shrink: 0;
		object-fit: cover;
		border-radius: var(--radius-md);
		background: var(--bg-tertiary);
	}

	.nav-dropdown-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.nav-dropdown-title {
		font-size: 0.8125rem;
		font-weight: 600;
		line-height: 1.35;
		color: var(--text-primary);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.nav-dropdown-date {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.site-nav-right {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	/* Theme toggle (flat gray fill) */
	.site-nav-theme-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-full);
		color: var(--text-secondary);
		background: var(--bg-tertiary);
		border: none;
		cursor: pointer;
		transition: color 0.2s ease, background 0.2s ease, transform 0.1s ease;
	}

	.site-nav-theme-btn:hover {
		color: var(--text-primary);
		background: color-mix(in srgb, var(--bg-tertiary), var(--text-primary) 8%);
	}

	.site-nav-theme-btn:active {
		transform: scale(0.96);
	}

	@media (max-width: 768px) {
		.site-nav-links {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.nav-dropdown {
			transform: none;
			transition: opacity 0.18s ease, visibility 0.18s ease;
		}
	}
</style>
