<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { sectionUrl, isSection } from '$lib/config/links';
	import { GITHUB_REPO } from '$lib/config/site';
	import { getSortedPosts } from '$lib/utils/blog-posts';
	import { formatDate } from '$lib/utils/format-date';

	// Newest posts for the Blog hover dropdown. blog-posts uses an eager glob, so
	// this resolves synchronously at build time and is safe to read during SSR.
	const recentPosts = getSortedPosts().slice(0, 4);

	const pathname = $derived(page.url.pathname);
	const onHome = $derived(pathname === '/');
	const onBlog = $derived(pathname.startsWith('/blog'));

	let menuOpen = $state(false);
	let scrolled = $state(false);

	// The nav sits flush and borderless at the top of the page, then condenses
	// into a glass bar once the page scrolls.
	$effect(() => {
		const onScroll = () => (scrolled = window.scrollY > 8);
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	// Close the mobile menu on navigation.
	$effect(() => {
		void pathname;
		menuOpen = false;
	});

	// Escape closes the mobile menu while it is open.
	$effect(() => {
		if (!menuOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') menuOpen = false;
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});
</script>

<nav class="site-nav" class:scrolled={scrolled || menuOpen}>
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
			<a href="/download" class="btn btn-secondary btn-sm site-nav-cta">Download</a>
			<a href={sectionUrl('app')} class="btn btn-primary btn-sm site-nav-cta">
				<span class="live-dot" aria-hidden="true"></span>
				Try Live
			</a>
			<button
				type="button"
				class="site-nav-burger"
				onclick={() => (menuOpen = !menuOpen)}
				aria-label={menuOpen ? 'Close menu' : 'Open menu'}
				aria-expanded={menuOpen}
				aria-controls="site-nav-mobile"
			>
				<Icon name={menuOpen ? 'xmark' : 'bars'} size={18} />
			</button>
		</div>
	</div>

	{#if menuOpen}
		<!-- Blurs the page behind the open menu; tapping it closes -->
		<button class="site-nav-backdrop" aria-label="Close menu" onclick={() => (menuOpen = false)}
		></button>
		<div id="site-nav-mobile" class="site-nav-mobile">
			<a href="/#features" class="site-nav-mobile-link" onclick={() => (menuOpen = false)}>Features</a>
			<a href={sectionUrl('docs')} class="site-nav-mobile-link" onclick={() => (menuOpen = false)}>Docs</a>
			<a href="/blog" class="site-nav-mobile-link" onclick={() => (menuOpen = false)}>Blog</a>
			<a
				href={GITHUB_REPO}
				target="_blank"
				rel="noopener noreferrer"
				class="site-nav-mobile-link"
				onclick={() => (menuOpen = false)}>GitHub</a
			>
			<a
				href="/download"
				class="btn btn-secondary btn-block"
				onclick={() => (menuOpen = false)}>Download</a
			>
			<a
				href={sectionUrl('app')}
				class="btn btn-primary btn-block"
				onclick={() => (menuOpen = false)}
			>
				<span class="live-dot" aria-hidden="true"></span>
				Try Live
			</a>
		</div>
	{/if}
</nav>

<style>
	.site-nav {
		position: sticky;
		top: 0;
		z-index: 50;
		background: transparent;
		-webkit-backdrop-filter: blur(14px) saturate(1.4);
		backdrop-filter: blur(14px) saturate(1.4);
		border-bottom: 1px solid transparent;
		transition: background 0.3s ease, border-color 0.3s ease;
	}

	.site-nav.scrolled {
		background: color-mix(in srgb, var(--bg-page) 78%, transparent);
		border-bottom-color: var(--border-subtle);
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

	/* Live indicator dot inside the Try Live button */
	.live-dot {
		width: 6px;
		height: 6px;
		border-radius: var(--radius-full);
		background: currentColor;
		animation: livePulse 2.4s ease-out infinite;
	}

	@keyframes livePulse {
		0% {
			box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.55);
		}
		70% {
			box-shadow: 0 0 0 5px rgba(255, 255, 255, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
		}
	}

	/* Hamburger (mobile only) */
	.site-nav-burger {
		display: none;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-full);
		color: var(--text-secondary);
		background: var(--bg-tertiary);
		border: none;
		cursor: pointer;
		transition: color 0.2s ease, background 0.2s ease;
	}

	.site-nav-burger:hover {
		color: var(--text-primary);
		background: color-mix(in srgb, var(--bg-tertiary), var(--text-primary) 8%);
	}

	/* Mobile menu panel: overlays the page below the bar instead of pushing
	   content down, and rides with the sticky nav on scroll */
	.site-nav-mobile {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.75rem 1.5rem 1.25rem;
		border-top: 1px solid var(--border-subtle);
		border-bottom: 1px solid var(--border-subtle);
		background: color-mix(in srgb, var(--bg-page) 92%, transparent);
		-webkit-backdrop-filter: blur(14px) saturate(1.4);
		backdrop-filter: blur(14px) saturate(1.4);
		box-shadow: var(--shadow-lg);
		animation: mobileMenuIn 0.2s var(--ease-brand);
	}

	@keyframes mobileMenuIn {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Full-viewport scrim behind the open menu. Sits under the nav's own
	   content via negative z inside the nav's stacking context. */
	.site-nav-backdrop {
		position: fixed;
		inset: 0;
		z-index: -1;
		border: none;
		padding: 0;
		cursor: default;
		background: color-mix(in srgb, var(--bg-page) 35%, transparent);
		-webkit-backdrop-filter: blur(10px);
		backdrop-filter: blur(10px);
		animation: backdropIn 0.25s ease;
	}

	@keyframes backdropIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.site-nav-mobile-link {
		padding: 0.65rem 0.25rem;
		font-size: 0.95rem;
		color: var(--text-secondary);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.site-nav-mobile-link:hover {
		color: var(--text-primary);
	}

	.site-nav-mobile .btn {
		margin-top: 0.5rem;
	}

	@media (max-width: 768px) {
		.site-nav-links {
			display: none;
		}

		.site-nav-cta {
			display: none;
		}

		.site-nav-burger {
			display: inline-flex;
		}
	}

	@media (min-width: 769px) {
		.site-nav-mobile {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.nav-dropdown {
			transform: none;
			transition: opacity 0.18s ease, visibility 0.18s ease;
		}

		.live-dot {
			animation: none;
		}
	}
</style>
