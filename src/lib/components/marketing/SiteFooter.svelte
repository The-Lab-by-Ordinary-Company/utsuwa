<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import { cycleTheme, getIconName, getLabel } from '$lib/config/docs-theme-toggle.svelte';
	import { sectionUrl } from '$lib/config/links';
	import { GITHUB_REPO, GITHUB_RELEASES } from '$lib/config/site';

	const themeIcon = $derived(getIconName());
	const themeLabel = $derived(getLabel());

	// Crossfade the whole page between themes where the browser supports it.
	function handleTheme() {
		if (document.startViewTransition) {
			document.startViewTransition(cycleTheme);
		} else {
			cycleTheme();
		}
	}
</script>

<footer class="site-footer">
	<div class="site-footer-inner">
		<div class="site-footer-top">
			<p class="site-footer-tagline">An open-source AI companion you can see and talk to.</p>

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
					<a href={GITHUB_RELEASES} target="_blank" rel="noopener noreferrer">Releases</a>
				</div>
				<div class="site-footer-col">
					<h3>Legal</h3>
					<a href="/privacy">Privacy Policy</a>
					<a href="/terms">Terms of Use</a>
					<a href={`${GITHUB_REPO}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">
						AGPL-3.0 License
					</a>
				</div>
			</div>
		</div>

		<div class="site-footer-bottom">
			<span>&copy; 2026 Juice Boxx Games LLC. Open source under AGPL-3.0.</span>
			<div class="site-footer-actions">
				<button
					type="button"
					onclick={handleTheme}
					class="site-footer-theme-btn"
					aria-label={`Theme: ${themeLabel}`}
					title={themeLabel}
				>
					<Icon name={themeIcon} size={15} />
				</button>
				<a
					href={GITHUB_REPO}
					target="_blank"
					rel="noopener noreferrer"
					class="site-footer-gh"
					aria-label="GitHub"
				>
				<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"
					><path
						d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
					/></svg
				>
				</a>
			</div>
		</div>
	</div>
</footer>

<style>
	.site-footer-inner {
		max-width: 80rem;
		margin: 0 auto;
		padding: clamp(4.5rem, 8vw, 7rem) 1.5rem 2rem;
	}

	.site-footer-top {
		display: grid;
		grid-template-columns: minmax(16rem, 1fr) auto;
		gap: clamp(3rem, 8vw, 7.5rem);
		align-items: start;
	}

	.site-footer-tagline {
		max-width: 25rem;
		margin: 0;
		font-size: clamp(1.125rem, 1.7vw, 1.5rem);
		line-height: 1.35;
		letter-spacing: -0.025em;
		color: var(--text-primary);
		text-wrap: balance;
	}

	.site-footer-cols {
		display: grid;
		grid-template-columns: repeat(3, minmax(7.5rem, 1fr));
		gap: 3rem;
	}

	.site-footer-col {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.625rem;
	}

	.site-footer-col h3 {
		margin: 0 0 0.375rem;
		font-size: 0.78rem;
		font-weight: 500;
		color: var(--text-tertiary);
	}

	.site-footer-col a {
		position: relative;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--text-primary);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.site-footer-col a:hover {
		color: var(--text-secondary);
	}

	.site-footer-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: clamp(4rem, 8vw, 7rem);
	}

	.site-footer-bottom span {
		font-size: 0.72rem;
		line-height: 1.5;
		color: var(--text-tertiary);
	}

	.site-footer-actions {
		display: flex;
		align-items: center;
		gap: 0.125rem;
	}

	.site-footer-theme-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--radius-full);
		color: var(--text-tertiary);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: color 0.15s ease, transform 0.1s ease;
	}

	.site-footer-theme-btn:hover {
		color: var(--text-primary);
	}

	.site-footer-theme-btn:active {
		transform: scale(0.96);
	}

	.site-footer-gh {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--radius-full);
		color: var(--text-tertiary);
		transition: color 0.15s ease, transform 0.1s ease;
	}

	.site-footer-gh:hover {
		color: var(--text-primary);
	}

	.site-footer-gh:active {
		transform: scale(0.96);
	}

	.site-footer-theme-btn:focus-visible,
	.site-footer-gh:focus-visible {
		outline: 1px solid var(--text-secondary);
		outline-offset: -4px;
	}

	@media (max-width: 760px) {
		.site-footer-inner {
			padding-top: 4rem;
		}

		.site-footer-top {
			grid-template-columns: 1fr;
			gap: 3rem;
		}

		.site-footer-tagline {
			max-width: 20rem;
		}

		.site-footer-cols {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 2.5rem 1.5rem;
		}

		.site-footer-bottom {
			align-items: flex-end;
			margin-top: 4rem;
		}

		.site-footer-bottom span {
			max-width: 15rem;
		}
	}
</style>
