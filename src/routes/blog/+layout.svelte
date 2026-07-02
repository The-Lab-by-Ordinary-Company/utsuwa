<script lang="ts">
	import { setupThemeWatcher } from '$lib/config/docs-theme';
	import { cycleTheme, getIconName, getLabel } from '$lib/config/docs-theme-toggle.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { formatDate } from '$lib/utils/format-date';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { GITHUB_REPO } from '$lib/config/site';
	import { sectionUrl, isSection } from '$lib/config/links';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();
	let blogEl = $state<HTMLDivElement | null>(null);

	const currentPath = $derived(page.url.pathname);
	const themeIcon = $derived(getIconName());
	const themeLabel = $derived(getLabel());

	// Recent-posts dropdown on the Blog nav item.
	let recentOpen = $state(false);
	let blogItemEl = $state<HTMLDivElement | null>(null);
	let recentBtnEl = $state<HTMLButtonElement | null>(null);

	function onFocusOut(e: FocusEvent) {
		const next = e.relatedTarget as Node | null;
		if (!blogItemEl) return;
		if (!next || !blogItemEl.contains(next)) recentOpen = false;
	}

	// Don't leave the panel hanging open after navigating to a post.
	$effect(() => {
		void currentPath;
		recentOpen = false;
	});

	// Dismiss on outside click or Escape while open.
	$effect(() => {
		if (!recentOpen) return;

		function onPointerDown(e: PointerEvent) {
			if (blogItemEl && !blogItemEl.contains(e.target as Node)) recentOpen = false;
		}
		function onKeydown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				recentOpen = false;
				recentBtnEl?.focus();
			}
		}

		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKeydown);
		return () => {
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKeydown);
		};
	});

	// Sync with the shared colorMode/.dark toggle (same as the docs).
	$effect(() => setupThemeWatcher(() => blogEl, browser));
</script>

<div class="docs blog-site" bind:this={blogEl}>
	<!-- Nav -->
	<nav class="blog-nav">
		<a href="/" class="nav-logo-link">
			<img src="/brand-assets/logo.svg" alt="Utsuwa" class="nav-logo" />
		</a>

		<div class="nav-links">
			<a href={sectionUrl('docs')} class="nav-link" class:active={isSection('docs')}>Docs</a>

			<div class="nav-item" bind:this={blogItemEl} onfocusout={onFocusOut}>
				<a href="/blog" class="nav-link" class:active={currentPath.startsWith('/blog')}>Blog</a>
				<button
					type="button"
					class="recent-toggle"
					class:open={recentOpen}
					bind:this={recentBtnEl}
					aria-haspopup="true"
					aria-expanded={recentOpen}
					aria-controls="blog-recent-menu"
					aria-label="Recent posts"
					onclick={() => (recentOpen = !recentOpen)}
				>
					<Icon name="chevron-down" size={12} />
				</button>

				{#if recentOpen && data.recentPosts?.length}
					<div class="recent-panel" id="blog-recent-menu">
						{#each data.recentPosts as post (post.slug)}
							<a href="/blog/{post.slug}" class="recent-row">
								<img class="recent-thumb" src={post.image} alt="" loading="lazy" />
								<span class="recent-text">
									<span class="recent-post-title">{post.title}</span>
									<time class="recent-post-date" datetime={post.date}>{formatDate(post.date)}</time>
								</span>
							</a>
						{/each}
					</div>
				{/if}
			</div>

			<a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" class="nav-link">GitHub</a>
		</div>

		<div class="nav-right">
			<button
				type="button"
				class="nav-theme-btn"
				onclick={cycleTheme}
				aria-label={`Theme: ${themeLabel}`}
				title={themeLabel}
			>
				<Icon name={themeIcon} size={16} />
			</button>
			<a href={sectionUrl('app')} class="btn btn-primary btn-sm">Try Live</a>
		</div>
	</nav>

	<main class="blog-main" data-pagefind-body>
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="blog-footer">
		<div class="footer-inner">
			<div class="footer-top">
				<div class="footer-brand">
					<img src="/brand-assets/logo.svg" alt="Utsuwa" class="footer-brand-logo" />
				</div>
				<div class="footer-columns">
					<div class="footer-col">
						<h3>Project</h3>
						<a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">GitHub</a>
						<a href={`${GITHUB_REPO}/releases`} target="_blank" rel="noopener noreferrer">Releases</a>
						<a href={sectionUrl('docs')}>Docs</a>
						<a href="/blog">Blog</a>
					</div>
					<div class="footer-col">
						<h3>Legal</h3>
						<a href={`${GITHUB_REPO}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">MIT License</a>
					</div>
				</div>
			</div>
		</div>
		<div class="footer-bottom">
			<span>&copy; 2026 Ordinary Company Group LLC. Open source under MIT.</span>
			<a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
				<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
			</a>
		</div>
	</footer>
</div>

<style>
	.blog-site {
		min-height: 100vh;
		background: var(--bg-page);
		color: var(--docs-text);
		font-family: var(--font-sans);
	}

	/* Nav */
	.blog-nav {
		position: sticky;
		top: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 80rem;
		margin: 0 auto;
		padding: 1.25rem 1.5rem;
		background: var(--bg-page);
		border-bottom: 1px solid var(--border-subtle);
	}

	.nav-logo-link {
		display: flex;
		align-items: center;
		text-decoration: none;
	}

	.nav-logo {
		height: 1.125rem;
		width: auto;
		filter: var(--docs-logo-filter, none);
		opacity: 0.85;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.nav-link {
		font-size: 0.875rem;
		color: var(--docs-text-muted);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.nav-link:hover {
		color: var(--docs-text);
	}

	.nav-link.active {
		color: var(--docs-accent);
	}

	/* Blog nav item with recent-posts dropdown */
	.nav-item {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.125rem;
	}

	.recent-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.125rem;
		border: none;
		background: transparent;
		color: var(--docs-text-muted);
		cursor: pointer;
		border-radius: 0.25rem;
		line-height: 0;
		transition: color 0.15s ease, transform 0.2s ease;
	}

	.recent-toggle:hover {
		color: var(--docs-text);
	}

	.recent-toggle.open {
		color: var(--docs-text);
		transform: rotate(180deg);
	}

	.recent-panel {
		position: absolute;
		top: calc(100% + 0.75rem);
		left: 0;
		z-index: 60;
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

	.recent-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: background 0.15s ease;
	}

	.recent-row:hover {
		background: var(--bg-secondary);
	}

	.recent-thumb {
		width: 3rem;
		height: 3rem;
		flex-shrink: 0;
		object-fit: cover;
		border-radius: var(--radius-md);
		background: var(--bg-tertiary);
	}

	.recent-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.recent-post-title {
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

	.recent-post-date {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.nav-right {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.nav-theme-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 9999px;
		color: var(--text-secondary);
		background: var(--bg-tertiary);
		border: none;
		cursor: pointer;
		transition: color 0.2s ease, background 0.2s ease;
	}

	.nav-theme-btn:hover {
		color: var(--text-primary);
		background: color-mix(in srgb, var(--bg-tertiary), var(--text-primary) 8%);
	}

	.nav-theme-btn:active {
		transform: scale(0.96);
	}

	/* Main content */
	.blog-main {
		max-width: 64rem;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
	}

	/* Footer */
	.blog-footer {
		border-top: 1px solid var(--docs-border);
	}

	.footer-inner {
		max-width: 80rem;
		margin: 0 auto;
		padding: 3rem 1.5rem;
	}

	.footer-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 3rem;
	}

	.footer-brand-logo {
		height: 1.25rem;
		width: auto;
		filter: var(--docs-logo-filter, none);
		opacity: 0.7;
	}

	.footer-columns {
		display: flex;
		gap: 4rem;
	}

	.footer-col {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: 120px;
	}

	.footer-col h3 {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--docs-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.25rem 0;
		opacity: 0.7;
	}

	.footer-col a {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--docs-text-muted);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.footer-col a:hover {
		color: var(--docs-accent);
	}

	.footer-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: 80rem;
		margin: 0 auto;
		padding: 1.5rem;
		border-top: 1px solid var(--docs-border);
	}

	.footer-bottom span {
		font-size: 0.6875rem;
		color: var(--docs-text-muted);
		font-weight: 500;
		opacity: 0.8;
	}

	.footer-bottom a {
		color: var(--docs-text-muted);
		transition: color 0.15s ease;
	}

	.footer-bottom a:hover {
		color: var(--docs-accent);
	}

	@media (max-width: 768px) {
		.blog-main {
			padding: 1.5rem 1rem 3rem;
		}

		.nav-links {
			display: none;
		}

		.footer-top {
			flex-direction: column;
			gap: 2rem;
		}

		.footer-columns {
			gap: 3rem;
		}
	}
</style>
