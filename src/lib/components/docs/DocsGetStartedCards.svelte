<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
</script>

<div class="cards">
	<div class="card">
		<div class="card-icon">
			<Icon name="globe" size={32} />
		</div>
		<h3 class="card-title">Web</h3>
		<p class="card-desc">
			No installation required. Runs entirely in your browser — works on desktop and mobile.
		</p>
		<div class="card-actions">
			<a href="https://utsuwa.ai" target="_blank" rel="noopener noreferrer" class="card-btn primary">
				Open App
				<Icon name="arrow-right" size={14} />
			</a>
			<a href="/docs/guides/web-guide" class="card-link">How to use?</a>
		</div>
	</div>

	<div class="card">
		<div class="card-icon">
			<Icon name="monitor" size={32} />
		</div>
		<h3 class="card-title">Desktop</h3>
		<p class="card-desc">
			Standalone app with local LLM support and more powerful features.
		</p>
		<div class="card-actions">
			<span class="card-btn disabled">
				Coming Soon
			</span>
			<a href="/docs/guides/desktop-guide" class="card-link">Learn more</a>
		</div>
	</div>
</div>

<style>
	.cards {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin: 1.5rem 0;
	}

	.card {
		border: 1px solid var(--docs-border);
		border-radius: 0.75rem;
		padding: 1.5rem;
		background: var(--docs-surface);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.card:hover {
		border-color: var(--docs-accent);
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	}

	.card-icon {
		color: var(--docs-accent);
		margin-bottom: 0.25rem;
	}

	.card-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--docs-text);
		margin: 0;
	}

	.card-desc {
		font-size: 0.875rem;
		color: var(--docs-text-muted);
		line-height: 1.5;
		margin: 0;
		flex: 1;
	}

	.card-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-top: 0.75rem;
	}

	.card-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		text-decoration: none;
		transition: opacity 0.15s;
	}

	.card-btn.primary {
		background: var(--docs-accent);
		color: #fff;
	}

	.card-btn.primary:hover {
		opacity: 0.85;
	}

	.card-btn.disabled {
		background: var(--docs-border);
		color: var(--docs-text-muted);
		cursor: default;
	}

	.card-link {
		font-size: 0.8125rem;
		color: var(--docs-text-muted);
		text-decoration: underline;
		text-underline-offset: 2px;
		transition: color 0.15s;
	}

	.card-link:hover {
		color: var(--docs-accent);
	}

	@media (max-width: 640px) {
		.cards {
			grid-template-columns: 1fr;
		}
	}
</style>
