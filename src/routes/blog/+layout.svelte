<script lang="ts">
	import { lightVars, applyVars } from '$lib/config/docs-theme';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { GITHUB_REPO } from '$lib/config/site';

	let { children } = $props();
	let blogEl = $state<HTMLDivElement | null>(null);

	const currentPath = $derived(page.url.pathname);

	$effect(() => {
		const el = blogEl;
		if (!el || !browser) return;
		applyVars(el, lightVars);
		document.documentElement.setAttribute('data-docs-theme', 'light');

		return () => {
			document.documentElement.removeAttribute('data-docs-theme');
		};
	});
</script>

<div class="docs blog-site" bind:this={blogEl}>
	<!-- Nav -->
	<nav class="blog-nav">
		<a href="/" class="nav-logo-link">
			<img src="/brand-assets/logo.svg" alt="Utsuwa" class="nav-logo" />
		</a>

		<div class="nav-links">
			<a href="/docs" class="nav-link" class:active={currentPath.startsWith('/docs')}>Docs</a>
			<a href="/blog" class="nav-link" class:active={currentPath.startsWith('/blog')}>Blog</a>
			<a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" class="nav-link">GitHub</a>
		</div>

		<a href="/app" class="nav-cta">Try Live</a>
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
						<a href="/docs">Docs</a>
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
		background: white;
		color: #1a1a1a;
		font-family: 'M PLUS Rounded 1c', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	/* Nav */
	.blog-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 80rem;
		margin: 0 auto;
		padding: 1.25rem 1.5rem;
	}

	.nav-logo-link {
		display: flex;
		align-items: center;
		text-decoration: none;
	}

	.nav-logo {
		height: 1.125rem;
		width: auto;
		filter: brightness(0);
		opacity: 0.8;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	.nav-link {
		font-size: 0.875rem;
		color: rgba(0, 0, 0, 0.5);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.nav-link:hover {
		color: #1a1a1a;
	}

	.nav-link.active {
		color: #01B2FF;
	}

	.nav-cta {
		font-size: 0.75rem;
		font-weight: 600;
		color: white;
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		background: linear-gradient(180deg, #4dd0ff 0%, #01b2ff 40%, #0099dd 100%);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.3),
			0 2px 4px rgba(1, 178, 255, 0.2);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.nav-cta:hover {
		background: linear-gradient(180deg, #5dd8ff 0%, #1abcff 40%, #01a8ee 100%);
		transform: translateY(-1px);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.4),
			0 0 12px rgba(1, 178, 255, 0.35),
			0 2px 8px rgba(1, 178, 255, 0.25);
	}

	/* Main content */
	.blog-main {
		max-width: 64rem;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
	}

	/* Footer */
	.blog-footer {
		border-top: 1px solid rgba(0, 0, 0, 0.05);
		background: #f5f7fa;
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
		filter: brightness(0);
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
		color: rgba(0, 0, 0, 0.35);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.25rem 0;
	}

	.footer-col a {
		font-size: 0.75rem;
		font-weight: 500;
		color: rgba(0, 0, 0, 0.6);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.footer-col a:hover {
		color: #01B2FF;
	}

	.footer-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: 80rem;
		margin: 0 auto;
		padding: 1.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}

	.footer-bottom span {
		font-size: 0.6875rem;
		color: rgba(0, 0, 0, 0.35);
		font-weight: 500;
	}

	.footer-bottom a {
		color: rgba(0, 0, 0, 0.4);
		transition: color 0.15s ease;
	}

	.footer-bottom a:hover {
		color: #01B2FF;
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
