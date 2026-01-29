<script lang="ts">
	const version = `v${import.meta.env.VITE_APP_VERSION}`;
	const releaseUrl = 'https://github.com/dyascj/utsuwa/releases';
</script>

<a href={releaseUrl} target="_blank" rel="noopener noreferrer" class="version-chip">
	{version}
</a>

<style>
	.version-chip {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: 9999px;
		border: 1px solid var(--docs-border);
		color: var(--docs-text-muted);
		text-decoration: none;
		transition: border-color 0.15s, color 0.15s;
	}

	.version-chip:hover {
		border-color: var(--docs-accent);
		color: var(--docs-accent);
	}
</style>
