<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import { GITHUB_RELEASES } from '$lib/config/site';
	import { localPath, sectionUrl } from '$lib/config/links';
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
			<a href={sectionUrl('app')} class="card-btn primary">
				<span>Open App</span>
				<Icon name="arrow-right" size={14} />
			</a>
			<a href={localPath('docs', '/guides/web-guide')} class="card-link">How to use?</a>
		</div>
	</div>

	<div class="card">
		<div class="card-icon">
			<Icon name="monitor" size={32} />
		</div>
		<h3 class="card-title">Desktop</h3>
		<p class="card-desc">
			Desktop app with transparent overlay mode for macOS, Windows, and Linux.
		</p>
		<div class="card-actions">
			<a href={GITHUB_RELEASES} target="_blank" rel="noopener noreferrer" class="card-btn primary">
				<span>Download</span>
				<Icon name="download" size={14} />
			</a>
			<a href={localPath('docs', '/guides/desktop-guide')} class="card-link">Setup guide</a>
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
		border: 1px solid var(--docs-border);
		border-radius: 1rem;
		padding: 1.75rem;
		background: var(--docs-surface);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
	}

	.card:hover {
		border-color: var(--docs-accent);
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
	}

	.card-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 0.875rem;
		background: var(--docs-btn-gradient);
		color: white;
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
		transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
	}

	.card-btn.primary {
		background: var(--docs-btn-gradient);
		color: white;
		box-shadow: var(--docs-btn-shadow);
	}

	.card-btn.primary:hover {
		background: var(--docs-btn-gradient-hover);
		transform: translateY(-1px);
		box-shadow: var(--docs-btn-shadow-hover);
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
