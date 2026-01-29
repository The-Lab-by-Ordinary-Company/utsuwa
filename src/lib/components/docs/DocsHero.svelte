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
		min-height: 70vh;
		padding: 4rem 2rem;
		text-align: center;
	}

	.hero-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		max-width: 640px;
	}

	.hero-logo {
		height: 3rem;
		width: auto;
		filter: var(--docs-logo-filter, none);
	}

	.hero-tagline {
		font-size: 1.125rem;
		line-height: 1.7;
		color: var(--docs-text-muted);
		margin: 0;
	}

	.hero-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.btn-primary,
	.btn-secondary {
		display: inline-flex;
		align-items: center;
		padding: 0.625rem 1.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.5rem;
		text-decoration: none;
		transition: all 0.15s;
	}

	.btn-primary {
		background: var(--docs-accent);
		color: #fafafa;
	}

	.btn-primary:hover {
		opacity: 0.85;
	}

	.btn-secondary {
		border: 1px solid var(--docs-border);
		color: var(--docs-text);
		background: transparent;
	}

	.btn-secondary:hover {
		border-color: var(--docs-text-muted);
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
