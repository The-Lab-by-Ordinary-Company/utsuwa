<script lang="ts">
	import { sectionUrl } from '$lib/config/links';
	import { GITHUB_REPO } from '$lib/config/site';
</script>

<footer class="site-footer">
	<div class="site-footer-inner">
		<div class="site-footer-top">
			<div class="site-footer-brand">
				<img src="/brand-assets/logo.svg" alt="Utsuwa" class="site-footer-logo" />
				<p class="site-footer-tagline">An open-source AI companion you can see and talk to.</p>
			</div>

			<div class="site-footer-cols">
				<div class="site-footer-col">
					<h3>Product</h3>
					<a href="/#features">Features</a>
					<a href="/download">Download</a>
					<a href={sectionUrl('app')}>Try live</a>
				</div>
				<div class="site-footer-col">
					<h3>Resources</h3>
					<a href={sectionUrl('docs')}>Docs</a>
					<a href="/blog">Blog</a>
					<a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">GitHub</a>
				</div>
				<div class="site-footer-col">
					<h3>Legal</h3>
					<a href={`${GITHUB_REPO}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">
						MIT License
					</a>
				</div>
			</div>
		</div>

		<div class="site-footer-bottom">
			<span>&copy; 2026 Ordinary Company Group LLC. Open source under MIT.</span>
		</div>
	</div>
</footer>

<style>
	.site-footer {
		border-top: 1px solid var(--border-subtle);
	}

	.site-footer-inner {
		max-width: 80rem;
		margin: 0 auto;
		padding: 3.5rem 1.5rem 2rem;
	}

	.site-footer-top {
		display: flex;
		justify-content: space-between;
		gap: 3rem;
		flex-wrap: wrap;
	}

	.site-footer-brand {
		max-width: 20rem;
	}

	.site-footer-logo {
		height: 1.25rem;
		width: auto;
		filter: brightness(0);
		opacity: 0.85;
	}

	:global(.dark) .site-footer-logo {
		filter: none;
	}

	.site-footer-tagline {
		margin: 0.9rem 0 0;
		font-size: 0.9rem;
		line-height: 1.6;
		color: var(--text-secondary);
	}

	.site-footer-cols {
		display: flex;
		gap: 4rem;
		flex-wrap: wrap;
	}

	.site-footer-col {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.site-footer-col h3 {
		margin: 0 0 0.25rem;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-tertiary);
	}

	.site-footer-col a {
		font-size: 0.85rem;
		color: var(--text-secondary);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.site-footer-col a:hover {
		color: var(--text-primary);
	}

	.site-footer-bottom {
		margin-top: 3rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-subtle);
	}

	.site-footer-bottom span {
		font-size: 0.75rem;
		color: var(--text-tertiary);
	}

	@media (max-width: 640px) {
		.site-footer-cols {
			gap: 2.5rem;
		}
	}
</style>
