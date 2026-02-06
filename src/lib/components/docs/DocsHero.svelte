<script lang="ts">
	import DocsVersionChip from './DocsVersionChip.svelte';
</script>

<div class="hero">
	<div class="hero-content">
		<DocsVersionChip />
		<img src="/brand-assets/logo.svg" alt="Utsuwa" class="hero-logo" />
		<p class="hero-tagline">
			A vessel for the soul of your virtual companion — bringing AI characters to life.
		</p>
		<div class="hero-actions">
			<a href="/" class="btn-secondary">Try Live</a>
			<a href="/docs/overview/introduction" class="btn-primary">Get Started</a>
		</div>
	</div>
</div>

<style>
	.hero {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		padding: 4rem 2rem 3rem;
		text-align: center;
		position: relative;
		overflow: hidden;
		border-bottom: 1px solid var(--docs-border);
		margin-bottom: 0;
		background: url('/blog/hero-background.png') center / cover no-repeat;
	}

	.hero::after {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--docs-bg);
		opacity: 0.75;
		pointer-events: none;
	}

	.hero-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		max-width: 640px;
		position: relative;
		z-index: 1;
	}

	.hero-logo {
		height: 3.5rem;
		width: auto;
		filter: var(--docs-logo-filter, none);
		drop-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.hero-tagline {
		font-size: 1.25rem;
		line-height: 1.7;
		color: var(--docs-text-muted);
		margin: 0;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.btn-primary,
	.btn-secondary {
		display: inline-flex;
		align-items: center;
		padding: 0.875rem 2rem;
		font-size: 0.9375rem;
		font-weight: 600;
		border-radius: 999px;
		text-decoration: none;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.btn-primary {
		background: var(--docs-btn-gradient);
		color: white;
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			var(--docs-btn-shadow),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
	}

	.btn-primary:hover {
		background: var(--docs-btn-gradient-hover);
		transform: translateY(-2px);
		box-shadow:
			var(--docs-btn-shadow-hover),
			inset 0 1px 0 rgba(255, 255, 255, 0.5);
	}

	.btn-primary:active {
		transform: translateY(0);
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.btn-secondary {
		border: 1px solid var(--docs-border);
		color: var(--docs-text);
		background: var(--docs-glass-bg);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.btn-secondary:hover {
		border-color: var(--docs-accent);
		background: var(--docs-surface-solid);
		transform: translateY(-2px);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 0 16px var(--docs-glow),
			0 4px 12px rgba(0, 0, 0, 0.12);
	}

	.btn-secondary:active {
		transform: translateY(0);
		box-shadow:
			0 1px 2px var(--docs-inner-shadow) inset,
			0 0 8px var(--docs-glow);
	}

	@media (max-width: 640px) {
		.hero-actions {
			flex-direction: column;
			width: 100%;
		}

		.btn-primary,
		.btn-secondary {
			justify-content: center;
		}

	}
</style>
