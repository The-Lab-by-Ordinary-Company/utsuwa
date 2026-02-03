<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
</script>

<div class="cards">
	<div class="card">
		<div class="card-icon">
			<Icon name="globe" size={32} />
			<div class="card-icon-shine"></div>
		</div>
		<h3 class="card-title">Web</h3>
		<p class="card-desc">
			No installation required. Runs entirely in your browser — works on desktop and mobile.
		</p>
		<div class="card-actions">
			<a href="https://utsuwa.ai" target="_blank" rel="noopener noreferrer" class="card-btn primary">
				<span>Open App</span>
				<Icon name="arrow-right" size={14} />
				<div class="btn-shine"></div>
			</a>
			<a href="/docs/guides/web-guide" class="card-link">How to use?</a>
		</div>
	</div>

	<div class="card">
		<div class="card-icon">
			<Icon name="monitor" size={32} />
			<div class="card-icon-shine"></div>
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
		gap: 1.25rem;
		margin: 2rem 0;
	}

	.card {
		border: 1px solid var(--docs-glass-border);
		border-radius: 1rem;
		padding: 1.75rem;
		background: var(--docs-glass-bg);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 4px 16px rgba(0, 0, 0, 0.08);
	}

	.card:hover {
		border-color: var(--docs-accent);
		transform: translateY(-4px);
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 0 20px var(--docs-glow),
			0 8px 32px rgba(0, 0, 0, 0.12);
	}

	.card-icon {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 0.875rem;
		background: var(--docs-btn-gradient);
		color: white;
		margin-bottom: 0.25rem;
		box-shadow:
			0 2px 0 rgba(255, 255, 255, 0.35) inset,
			0 -1px 2px rgba(0, 0, 0, 0.1) inset,
			0 6px 16px var(--docs-glow);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.card-icon-shine {
		position: absolute;
		top: 3px;
		left: 15%;
		right: 15%;
		height: 40%;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.1) 60%, transparent 100%);
		border-radius: 0.5rem 0.5rem 50% 50%;
		pointer-events: none;
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
		line-height: 1.6;
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
		padding: 0.625rem 1.25rem;
		border-radius: 999px;
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.card-btn.primary {
		position: relative;
		background: var(--docs-btn-gradient);
		color: white;
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.35) inset,
			0 -1px 2px rgba(0, 0, 0, 0.1) inset,
			0 4px 12px var(--docs-glow);
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
		overflow: hidden;
	}

	.btn-shine {
		position: absolute;
		top: 2px;
		left: 15%;
		right: 15%;
		height: 45%;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 60%, transparent 100%);
		border-radius: 999px 999px 50% 50%;
		pointer-events: none;
	}

	.card-btn.primary:hover {
		background: var(--docs-btn-gradient-hover);
		transform: translateY(-1px);
		box-shadow:
			0 1px 0 rgba(255, 255, 255, 0.4) inset,
			0 4px 12px var(--docs-glow-strong);
	}

	.card-btn.disabled {
		background: var(--docs-surface);
		color: var(--docs-text-muted);
		border: 1px solid var(--docs-border);
		cursor: default;
		box-shadow:
			0 1px 0 var(--docs-inner-highlight) inset,
			0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.card-link {
		font-size: 0.8125rem;
		color: var(--docs-text-muted);
		text-decoration: none;
		transition: all 0.15s;
		padding: 0.25rem 0;
		border-bottom: 1px solid transparent;
	}

	.card-link:hover {
		color: var(--docs-accent);
		border-bottom-color: var(--docs-accent);
	}

	@media (max-width: 640px) {
		.cards {
			grid-template-columns: 1fr;
		}
	}
</style>
